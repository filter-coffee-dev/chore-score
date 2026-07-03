import { APIGatewayProxyHandler } from 'aws-lambda';
import { GetCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLES, getUserId } from '../shared/db';
import { ok, notFound, serverError } from '../shared/types';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = getUserId(event);

    const userResult = await docClient.send(new GetCommand({
      TableName: TABLES.USERS,
      Key: { userId },
    }));
    const householdId = userResult.Item?.householdId as string | undefined;
    if (!householdId) return notFound('You are not in a household');

    const hhResult = await docClient.send(new GetCommand({
      TableName: TABLES.HOUSEHOLDS,
      Key: { householdId },
    }));
    const hh = hhResult.Item;
    if (!hh) return notFound('Household not found');

    const isM1 = hh.member1Id === userId;
    const hasPartner = !!hh.member2Id;

    if (!isM1 && hh.member2Id !== userId) {
      return notFound('You are not a member of this household');
    }

    if (!hasPartner) {
      // Only member — delete the household
      await docClient.send(new DeleteCommand({
        TableName: TABLES.HOUSEHOLDS,
        Key: { householdId },
      }));
    } else if (isM1) {
      // Promote member2 → member1, clear member2 slot
      await docClient.send(new UpdateCommand({
        TableName: TABLES.HOUSEHOLDS,
        Key: { householdId },
        UpdateExpression: 'SET member1Id = :m2id, member1Name = :m2name REMOVE member2Id, member2Name',
        ExpressionAttributeValues: {
          ':m2id': hh.member2Id,
          ':m2name': hh.member2Name,
        },
      }));
    } else {
      // member2 leaving — just clear the slot
      await docClient.send(new UpdateCommand({
        TableName: TABLES.HOUSEHOLDS,
        Key: { householdId },
        UpdateExpression: 'REMOVE member2Id, member2Name',
      }));
    }

    // Clear householdId from user record
    await docClient.send(new UpdateCommand({
      TableName: TABLES.USERS,
      Key: { userId },
      UpdateExpression: 'REMOVE householdId',
    }));

    return ok({ message: 'You have left the household' });
  } catch (err) {
    console.error(err);
    return serverError('Failed to leave household');
  }
};
