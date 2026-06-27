import { APIGatewayProxyHandler } from 'aws-lambda';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { docClient, TABLES, getUserId } from '../shared/db';
import { badRequest, created, notFound, serverError } from '../shared/types';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = getUserId(event);
    const { name, emoji, weight, frequency } = JSON.parse(event.body ?? '{}');

    if (!name || !weight || !frequency) return badRequest('name, weight, and frequency are required');
    if (weight < 1 || weight > 5) return badRequest('weight must be between 1 and 5');
    if (!['daily', 'weekly', 'monthly'].includes(frequency)) {
      return badRequest('frequency must be daily, weekly, or monthly');
    }

    const userResult = await docClient.send(new GetCommand({
      TableName: TABLES.USERS,
      Key: { userId },
    }));
    const householdId = userResult.Item?.householdId;
    if (!householdId) return notFound('Join a household first!');

    const chore = {
      householdId,
      choreId: uuidv4(),
      name,
      emoji: emoji ?? '🧹',
      weight: Number(weight),
      frequency,
      createdAt: new Date().toISOString(),
      createdBy: userId,
    };

    await docClient.send(new PutCommand({ TableName: TABLES.CHORES, Item: chore }));

    return created({ chore });
  } catch (err) {
    console.error(err);
    return serverError('Failed to create chore');
  }
};
