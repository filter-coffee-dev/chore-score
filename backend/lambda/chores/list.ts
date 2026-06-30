import { APIGatewayProxyHandler } from 'aws-lambda';
import { GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLES, getUserId, periodStart } from '../shared/db';
import { notFound, ok, serverError } from '../shared/types';
import { Chore, ChoreWithStatus, Completion } from '../shared/types';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = getUserId(event);

    const userResult = await docClient.send(new GetCommand({
      TableName: TABLES.USERS,
      Key: { userId },
    }));
    const householdId = userResult.Item?.householdId;
    if (!householdId) return notFound('Join a household first!');

    // Get all chores
    const choresResult = await docClient.send(new QueryCommand({
      TableName: TABLES.CHORES,
      KeyConditionExpression: 'householdId = :hid',
      ExpressionAttributeValues: { ':hid': householdId },
    }));
    const chores = (choresResult.Items ?? []) as Chore[];

    // Get recent completions (last 30 days) to determine which are done this period
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const completionsResult = await docClient.send(new QueryCommand({
      TableName: TABLES.COMPLETIONS,
      KeyConditionExpression: 'householdId = :hid AND completionId > :since',
      ExpressionAttributeValues: { ':hid': householdId, ':since': thirtyDaysAgo },
    }));
    const completions = (completionsResult.Items ?? []) as Completion[];

    // Annotate each chore with current-period completion status
    const choresWithStatus: ChoreWithStatus[] = chores.map((chore) => {
      // on_demand chores are always claimable — no period restriction
      if (chore.frequency === 'on_demand') {
        return { ...chore, completedThisPeriod: false };
      }
      const periodBegin = periodStart(chore.frequency);
      const periodCompletion = completions.find(
        (c) => c.choreId === chore.choreId && c.completedAt >= periodBegin
      );
      return {
        ...chore,
        completedThisPeriod: !!periodCompletion,
        completedBy: periodCompletion?.userName,
      };
    });

    return ok({ chores: choresWithStatus });
  } catch (err) {
    console.error(err);
    return serverError('Failed to list chores');
  }
};
