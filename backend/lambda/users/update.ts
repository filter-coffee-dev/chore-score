import { APIGatewayProxyHandler } from 'aws-lambda';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLES, getUserId } from '../shared/db';
import { badRequest, ok, serverError } from '../shared/types';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = getUserId(event);
    const body = JSON.parse(event.body ?? '{}');
    const { name, deviceToken, avatar } = body;

    if (!name && !deviceToken && !avatar) return badRequest('Provide name, deviceToken, or avatar');

    const updates: string[] = [];
    const values: Record<string, string> = {};

    if (name) { updates.push('#n = :name'); values[':name'] = name; }
    if (deviceToken) { updates.push('deviceToken = :dt'); values[':dt'] = deviceToken; }
    if (avatar) {
      if (!['guy', 'girl'].includes(avatar)) return badRequest('Invalid avatar');
      updates.push('avatar = :avatar'); values[':avatar'] = avatar;
    }

    await docClient.send(new UpdateCommand({
      TableName: TABLES.USERS,
      Key: { userId },
      UpdateExpression: `SET ${updates.join(', ')}`,
      ExpressionAttributeValues: values,
      ExpressionAttributeNames: name ? { '#n': 'name' } : undefined,
    }));

    return ok({ updated: true });
  } catch (err) {
    console.error(err);
    return serverError('Failed to update user');
  }
};
