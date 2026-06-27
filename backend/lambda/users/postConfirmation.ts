import { PostConfirmationTriggerHandler } from 'aws-lambda';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLES } from '../shared/db';

export const handler: PostConfirmationTriggerHandler = async (event) => {
  const { sub, email, name } = event.request.userAttributes;

  await docClient.send(new PutCommand({
    TableName: TABLES.USERS,
    Item: {
      userId: sub,
      email,
      name: name ?? email.split('@')[0],
      createdAt: new Date().toISOString(),
    },
    ConditionExpression: 'attribute_not_exists(userId)',
  }));

  return event;
};
