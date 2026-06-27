import { APIGatewayProxyHandler } from 'aws-lambda';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLES, getUserId } from '../shared/db';
import { notFound, ok, serverError } from '../shared/types';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = getUserId(event);

    const userResult = await docClient.send(new GetCommand({
      TableName: TABLES.USERS,
      Key: { userId },
    }));

    const householdId = userResult.Item?.householdId;
    if (!householdId) return notFound('No household found. Create or join one!');

    const householdResult = await docClient.send(new GetCommand({
      TableName: TABLES.HOUSEHOLDS,
      Key: { householdId },
    }));

    if (!householdResult.Item) return notFound('Household not found');

    return ok(householdResult.Item);
  } catch (err) {
    console.error(err);
    return serverError('Failed to get household');
  }
};
