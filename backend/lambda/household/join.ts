import { APIGatewayProxyHandler } from 'aws-lambda';
import { QueryCommand, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLES, getUserId, getUserName } from '../shared/db';
import { badRequest, ok, notFound, serverError } from '../shared/types';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = getUserId(event);
    const userName = getUserName(event);
    const { inviteCode } = JSON.parse(event.body ?? '{}');

    if (!inviteCode) return badRequest('inviteCode is required');

    // Check if user already has a household
    const userResult = await docClient.send(new GetCommand({
      TableName: TABLES.USERS,
      Key: { userId },
    }));
    if (userResult.Item?.householdId) {
      return badRequest('You already belong to a household');
    }

    // Find household by invite code
    const result = await docClient.send(new QueryCommand({
      TableName: TABLES.HOUSEHOLDS,
      IndexName: 'InviteCodeIndex',
      KeyConditionExpression: 'inviteCode = :code',
      ExpressionAttributeValues: { ':code': inviteCode.toUpperCase() },
    }));

    const household = result.Items?.[0];
    if (!household) return notFound('Invalid invite code. Check with your partner.');
    if (household.member2Id) return badRequest('This household is already full!');
    if (household.member1Id === userId) return badRequest("That's your own invite code, silly.");

    const householdId = household.householdId as string;

    // Link user to household
    await docClient.send(new UpdateCommand({
      TableName: TABLES.HOUSEHOLDS,
      Key: { householdId },
      UpdateExpression: 'SET member2Id = :uid, member2Name = :name',
      ExpressionAttributeValues: { ':uid': userId, ':name': userName },
    }));

    await docClient.send(new UpdateCommand({
      TableName: TABLES.USERS,
      Key: { userId },
      UpdateExpression: 'SET householdId = :hid',
      ExpressionAttributeValues: { ':hid': householdId },
    }));

    return ok({
      householdId,
      member1Name: household.member1Name,
      member2Name: userName,
    });
  } catch (err) {
    console.error(err);
    return serverError('Failed to join household');
  }
};
