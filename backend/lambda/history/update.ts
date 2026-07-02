import { APIGatewayProxyHandler } from 'aws-lambda';
import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLES, getUserId } from '../shared/db';
import { badRequest, notFound, ok, serverError } from '../shared/types';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = getUserId(event);
    const completionId = decodeURIComponent(event.pathParameters?.completionId ?? '');
    if (!completionId) return badRequest('completionId is required');

    const { pointsEarned } = JSON.parse(event.body ?? '{}');
    if (typeof pointsEarned !== 'number' || pointsEarned < 1 || pointsEarned > 100) {
      return badRequest('pointsEarned must be between 1 and 100');
    }

    const userResult = await docClient.send(new GetCommand({
      TableName: TABLES.USERS,
      Key: { userId },
    }));
    const householdId = userResult.Item?.householdId;
    if (!householdId) return notFound('No household found');

    await docClient.send(new UpdateCommand({
      TableName: TABLES.COMPLETIONS,
      Key: { householdId, completionId },
      UpdateExpression: 'SET pointsEarned = :pts',
      ExpressionAttributeValues: { ':pts': pointsEarned },
      ConditionExpression: 'attribute_exists(completionId)',
    }));

    return ok({ updated: true });
  } catch (err: unknown) {
    if ((err as { name?: string }).name === 'ConditionalCheckFailedException') {
      return notFound('Completion not found');
    }
    console.error(err);
    return serverError('Failed to update completion');
  }
};
