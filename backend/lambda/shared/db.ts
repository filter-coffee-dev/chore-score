import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

export const TABLES = {
  USERS: process.env.USERS_TABLE!,
  HOUSEHOLDS: process.env.HOUSEHOLDS_TABLE!,
  CHORES: process.env.CHORES_TABLE!,
  COMPLETIONS: process.env.COMPLETIONS_TABLE!,
};

export function getUserId(event: AWSLambda.APIGatewayProxyEvent): string {
  return event.requestContext.authorizer?.claims?.sub as string;
}

export function getUserEmail(event: AWSLambda.APIGatewayProxyEvent): string {
  return event.requestContext.authorizer?.claims?.email as string;
}

export function getUserName(event: AWSLambda.APIGatewayProxyEvent): string {
  return (event.requestContext.authorizer?.claims?.name ||
    event.requestContext.authorizer?.claims?.email) as string;
}

export function periodStart(frequency: string): string {
  const now = new Date();
  if (frequency === 'daily') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  }
  if (frequency === 'weekly') {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.getFullYear(), now.getMonth(), diff).toISOString();
  }
  // monthly
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}
