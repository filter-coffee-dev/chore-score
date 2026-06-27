import { APIGatewayProxyHandler } from 'aws-lambda';
import { PutCommand, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { docClient, TABLES, getUserId, getUserName } from '../shared/db';
import { badRequest, created, serverError } from '../shared/types';

function generateInviteCode(): string {
  const words = ['STAR', 'FROG', 'MOON', 'BIRD', 'CAKE', 'FISH', 'DUCK', 'BEAR'];
  const word = words[Math.floor(Math.random() * words.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${word}-${num}`;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = getUserId(event);
    const userName = getUserName(event);

    // Check if user already has a household
    const userResult = await docClient.send(new GetCommand({
      TableName: TABLES.USERS,
      Key: { userId },
    }));
    if (userResult.Item?.householdId) {
      return badRequest('You already belong to a household');
    }

    const householdId = uuidv4();
    const inviteCode = generateInviteCode();
    const now = new Date().toISOString();

    await docClient.send(new PutCommand({
      TableName: TABLES.HOUSEHOLDS,
      Item: {
        householdId,
        inviteCode,
        member1Id: userId,
        member1Name: userName,
        createdAt: now,
      },
    }));

    await docClient.send(new UpdateCommand({
      TableName: TABLES.USERS,
      Key: { userId },
      UpdateExpression: 'SET householdId = :hid',
      ExpressionAttributeValues: { ':hid': householdId },
    }));

    return created({ householdId, inviteCode, member1Name: userName });
  } catch (err) {
    console.error(err);
    return serverError('Failed to create household');
  }
};
