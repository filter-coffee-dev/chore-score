import { APIGatewayProxyHandler } from 'aws-lambda';
import { GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLES, getUserId } from '../shared/db';
import { notFound, ok, serverError, Completion } from '../shared/types';
import { calculateBadges, getAllBadgeDefs } from '../shared/badges';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = getUserId(event);

    const userResult = await docClient.send(new GetCommand({
      TableName: TABLES.USERS,
      Key: { userId },
    }));
    const householdId = userResult.Item?.householdId;
    if (!householdId) return notFound('No household found');

    const householdResult = await docClient.send(new GetCommand({
      TableName: TABLES.HOUSEHOLDS,
      Key: { householdId },
    }));
    const household = householdResult.Item;
    if (!household) return notFound('Household not found');

    const completionsResult = await docClient.send(new QueryCommand({
      TableName: TABLES.COMPLETIONS,
      KeyConditionExpression: 'householdId = :hid',
      ExpressionAttributeValues: { ':hid': householdId },
    }));
    const allCompletions = (completionsResult.Items ?? []) as Completion[];

    // Calculate for each member
    const members = [
      { id: household.member1Id as string, name: household.member1Name as string },
      ...(household.member2Id ? [{ id: household.member2Id as string, name: household.member2Name as string }] : []),
    ];

    const result = members.map((member) => {
      const myCompletions = allCompletions.filter((c) => c.userId === member.id);
      const totalPoints = myCompletions.reduce((sum, c) => sum + c.pointsEarned, 0);
      const badges = calculateBadges(myCompletions, 0, totalPoints);
      return { userId: member.id, userName: member.name, badges };
    });

    return ok({ members: result, allBadges: getAllBadgeDefs() });
  } catch (err) {
    console.error(err);
    return serverError('Failed to get badges');
  }
};
