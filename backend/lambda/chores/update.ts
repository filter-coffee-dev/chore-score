import { APIGatewayProxyHandler } from 'aws-lambda';
import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
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

    const { name, emoji, weight, frequency } = JSON.parse(event.body ?? '{}');
    const updates: string[] = [];
    const values: Record<string, unknown> = {};

    if (name) { updates.push('#n = :name'); values[':name'] = name; }
    if (emoji) { updates.push('emoji = :emoji'); values[':emoji'] = emoji; }
    if (weight) {
      if (weight < 1 || weight > 5) return badRequest('weight must be 1–5');
      updates.push('#w = :weight'); values[':weight'] = Number(weight);
    }
    if (frequency) {
      if (!['daily', 'weekly', 'monthly'].includes(frequency)) return badRequest('Invalid frequency');
      updates.push('frequency = :freq'); values[':freq'] = frequency;
    }
    if (updates.length === 0) return badRequest('Nothing to update');

    await docClient.send(new UpdateCommand({
      TableName: TABLES.CHORES,
      Key: { householdId, choreId },
      UpdateExpression: `SET ${updates.join(', ')}`,
      ExpressionAttributeValues: values,
      ExpressionAttributeNames: { '#n': 'name', '#w': 'weight' },
      ConditionExpression: 'attribute_exists(choreId)',
    }));

    return ok({ updated: true });
  } catch (err: unknown) {
    if ((err as { name?: string }).name === 'ConditionalCheckFailedException') {
      return notFound('Chore not found');
    }
    console.error(err);
    return serverError('Failed to update chore');
  }
};
