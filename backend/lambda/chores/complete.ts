import { APIGatewayProxyHandler } from 'aws-lambda';
import { GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { PinpointClient, SendMessagesCommand } from '@aws-sdk/client-pinpoint';
import { v4 as uuidv4 } from 'uuid';
import { docClient, TABLES, getUserId, getUserName, periodStart } from '../shared/db';
import { badRequest, notFound, ok, serverError, Chore, Completion } from '../shared/types';

const pinpoint = new PinpointClient({});

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = getUserId(event);
    const userName = getUserName(event);
    const choreId = event.pathParameters?.choreId;
    if (!choreId) return badRequest('choreId is required');

    const userResult = await docClient.send(new GetCommand({
      TableName: TABLES.USERS,
      Key: { userId },
    }));
    const user = userResult.Item;
    if (!user?.householdId) return notFound('No household found');
    const householdId = user.householdId as string;

    // Get the chore
    const choreResult = await docClient.send(new GetCommand({
      TableName: TABLES.CHORES,
      Key: { householdId, choreId },
    }));
    const chore = choreResult.Item as Chore | undefined;
    if (!chore) return notFound('Chore not found');

    // Check if already completed this period (on_demand chores are always claimable)
    if (chore.frequency !== 'on_demand') {
      const periodBegin = periodStart(chore.frequency);
      const existingResult = await docClient.send(new QueryCommand({
        TableName: TABLES.COMPLETIONS,
        KeyConditionExpression: 'householdId = :hid AND completionId > :since',
        FilterExpression: 'choreId = :cid',
        ExpressionAttributeValues: {
          ':hid': householdId,
          ':since': periodBegin,
          ':cid': choreId,
        },
        Limit: 1,
      }));
      if ((existingResult.Items?.length ?? 0) > 0) {
        return badRequest('Already completed this period! Save some glory for next time. 😄');
      }
    }

    const now = new Date().toISOString();
    const completion: Completion = {
      householdId,
      completionId: `${now}#${uuidv4()}`,
      choreId,
      choreName: chore.name,
      choreEmoji: chore.emoji,
      userId,
      userName,
      pointsEarned: chore.weight,
      completedAt: now,
    };

    await docClient.send(new PutCommand({ TableName: TABLES.COMPLETIONS, Item: completion }));

    // Best-effort partner notification — must never throw past this point
    try {
      const householdResult = await docClient.send(new GetCommand({
        TableName: TABLES.HOUSEHOLDS,
        Key: { householdId },
      }));
      const household = householdResult.Item;
      if (household) {
        const partnerId = household.member1Id === userId ? household.member2Id : household.member1Id;
        if (partnerId) {
          const partnerResult = await docClient.send(new GetCommand({
            TableName: TABLES.USERS,
            Key: { userId: partnerId },
          }));
          const partnerToken = partnerResult.Item?.deviceToken;
          if (partnerToken && process.env.PINPOINT_APP_ID) {
            await pinpoint.send(new SendMessagesCommand({
              ApplicationId: process.env.PINPOINT_APP_ID,
              MessageRequest: {
                Addresses: { [partnerToken]: { ChannelType: 'GCM' } },
                MessageConfiguration: {
                  GCMMessage: {
                    Title: 'ChoreScore 🏆',
                    Body: `${userName} just did ${chore.emoji} ${chore.name}! +${chore.weight} pts. Are you going to let them win? 😤`,
                  },
                },
              },
            }));
          }
        }
      }
    } catch (notifErr) {
      console.warn('Failed to notify partner', notifErr);
    }

    return ok({ completion, pointsEarned: chore.weight });
  } catch (err) {
    console.error(err);
    return serverError('Failed to complete chore');
  }
};
