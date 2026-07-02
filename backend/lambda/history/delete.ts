import { APIGatewayProxyHandler } from 'aws-lambda';
import { GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLES, getUserId } from '../shared/db';
import { badRequest, notFound, ok, serverError } from '../shared/types';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = getUserId(event);
    const completionId = decodeURIComponent(event.pathParameters?.completionId ?? '');
    if (!completionId) return badRequest('completionId is required');

    const userResult = await docClient.send(new GetCommand({
      TableName: TABLES.USERS,
      Key: { userId },
    }));
    const householdId = userResult.Item?.householdId;
    if (!householdId) return notFound('No household found');

    await docClient.send(new DeleteCommand({
      TableName: TABLES.COMPLETIONS,
      Key: { householdId, completionId },
    }));

    return ok({ deleted: true });
  } catch (err) {
    console.error(err);
    return serverError('Failed to delete completion');
  }
};
