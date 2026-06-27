import { APIGatewayProxyHandler } from 'aws-lambda';
import { GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLES, getUserId } from '../shared/db';
import { badRequest, notFound, ok, serverError } from '../shared/types';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = getUserId(event);
    const choreId = event.pathParameters?.choreId;
    if (!choreId) return badRequest('choreId is required');

    const userResult = await docClient.send(new GetCommand({
      TableName: TABLES.USERS,
      Key: { userId },
    }));
    const householdId = userResult.Item?.householdId;
    if (!householdId) return notFound('No household found');

    await docClient.send(new DeleteCommand({
      TableName: TABLES.CHORES,
      Key: { householdId, choreId },
      ConditionExpression: 'attribute_exists(choreId)',
    }));

    return ok({ deleted: true });
  } catch (err: unknown) {
    if ((err as { name?: string }).name === 'ConditionalCheckFailedException') {
      return notFound('Chore not found');
    }
    console.error(err);
    return serverError('Failed to delete chore');
  }
};
