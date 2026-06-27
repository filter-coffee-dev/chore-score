import { APIGatewayProxyHandler } from 'aws-lambda';
import { GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLES, getUserId } from '../shared/db';
import { notFound, ok, serverError } from '../shared/types';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = getUserId(event);
    const limit = Math.min(Number(event.queryStringParameters?.limit ?? 50), 100);

    const userResult = await docClient.send(new GetCommand({
      TableName: TABLES.USERS,
      Key: { userId },
    }));
    const householdId = userResult.Item?.householdId;
    if (!householdId) return notFound('No household found');

    const result = await docClient.send(new QueryCommand({
      TableName: TABLES.COMPLETIONS,
      KeyConditionExpression: 'householdId = :hid',
      ExpressionAttributeValues: { ':hid': householdId },
      ScanIndexForward: false, // newest first
      Limit: limit,
    }));

    return ok({ completions: result.Items ?? [], count: result.Count ?? 0 });
  } catch (err) {
    console.error(err);
    return serverError('Failed to get history');
  }
};
