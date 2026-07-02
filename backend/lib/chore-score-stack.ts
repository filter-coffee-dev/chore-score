import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

import { Construct } from 'constructs';
import * as path from 'path';

export class ChoreScoreStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ── Cognito ──────────────────────────────────────────────────────────────

    const userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: 'ChoreScoreUserPool',
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: true },
        fullname: { required: true, mutable: true },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: false,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool,
      userPoolClientName: 'ChoreScoreMobileClient',
      generateSecret: false,
      authFlows: {
        userSrp: true,
        userPassword: true,
      },
      disableOAuth: true,
    });

    // ── DynamoDB Tables ───────────────────────────────────────────────────────

    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: 'ChoreScoreUsers',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const householdsTable = new dynamodb.Table(this, 'HouseholdsTable', {
      tableName: 'ChoreScoreHouseholds',
      partitionKey: { name: 'householdId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    householdsTable.addGlobalSecondaryIndex({
      indexName: 'InviteCodeIndex',
      partitionKey: { name: 'inviteCode', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const choresTable = new dynamodb.Table(this, 'ChoresTable', {
      tableName: 'ChoreScoreChores',
      partitionKey: { name: 'householdId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'choreId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const completionsTable = new dynamodb.Table(this, 'CompletionsTable', {
      tableName: 'ChoreScoreCompletions',
      partitionKey: { name: 'householdId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'completionId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    completionsTable.addGlobalSecondaryIndex({
      indexName: 'UserCompletionsIndex',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'completedAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ── Shared Lambda environment ─────────────────────────────────────────────
    // Note: Pinpoint (push notifications) requires manual account activation.
    // Set PINPOINT_APP_ID env var on CompleteChore Lambda after activating Pinpoint.

    const commonEnv = {
      USERS_TABLE: usersTable.tableName,
      HOUSEHOLDS_TABLE: householdsTable.tableName,
      CHORES_TABLE: choresTable.tableName,
      COMPLETIONS_TABLE: completionsTable.tableName,
    };

    const commonLambdaProps: Partial<lambdaNodejs.NodejsFunctionProps> = {
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(15),
      memorySize: 256,
      bundling: { minify: true, sourceMap: false },
      environment: commonEnv,
    };

    const lambdaDir = path.join(__dirname, '../lambda');

    // ── Lambda: Post-Confirmation trigger ────────────────────────────────────

    const postConfirmationFn = new lambdaNodejs.NodejsFunction(this, 'PostConfirmation', {
      ...commonLambdaProps,
      entry: path.join(lambdaDir, 'users/postConfirmation.ts'),
      functionName: 'ChoreScore-PostConfirmation',
    });
    usersTable.grantWriteData(postConfirmationFn);
    userPool.addTrigger(cognito.UserPoolOperation.POST_CONFIRMATION, postConfirmationFn);

    // ── Lambda: Users ─────────────────────────────────────────────────────────

    const updateUserFn = new lambdaNodejs.NodejsFunction(this, 'UpdateUser', {
      ...commonLambdaProps,
      entry: path.join(lambdaDir, 'users/update.ts'),
      functionName: 'ChoreScore-UpdateUser',
    });
    usersTable.grantReadWriteData(updateUserFn);

    // ── Lambda: Household ─────────────────────────────────────────────────────

    const createHouseholdFn = new lambdaNodejs.NodejsFunction(this, 'CreateHousehold', {
      ...commonLambdaProps,
      entry: path.join(lambdaDir, 'household/create.ts'),
      functionName: 'ChoreScore-CreateHousehold',
    });
    householdsTable.grantReadWriteData(createHouseholdFn);
    usersTable.grantReadWriteData(createHouseholdFn);

    const joinHouseholdFn = new lambdaNodejs.NodejsFunction(this, 'JoinHousehold', {
      ...commonLambdaProps,
      entry: path.join(lambdaDir, 'household/join.ts'),
      functionName: 'ChoreScore-JoinHousehold',
    });
    householdsTable.grantReadWriteData(joinHouseholdFn);
    usersTable.grantReadWriteData(joinHouseholdFn);

    const getHouseholdFn = new lambdaNodejs.NodejsFunction(this, 'GetHousehold', {
      ...commonLambdaProps,
      entry: path.join(lambdaDir, 'household/get.ts'),
      functionName: 'ChoreScore-GetHousehold',
    });
    householdsTable.grantReadData(getHouseholdFn);
    usersTable.grantReadData(getHouseholdFn);

    // ── Lambda: Chores ────────────────────────────────────────────────────────

    const listChoresFn = new lambdaNodejs.NodejsFunction(this, 'ListChores', {
      ...commonLambdaProps,
      entry: path.join(lambdaDir, 'chores/list.ts'),
      functionName: 'ChoreScore-ListChores',
    });
    choresTable.grantReadData(listChoresFn);
    completionsTable.grantReadData(listChoresFn);
    usersTable.grantReadData(listChoresFn);

    const createChoreFn = new lambdaNodejs.NodejsFunction(this, 'CreateChore', {
      ...commonLambdaProps,
      entry: path.join(lambdaDir, 'chores/create.ts'),
      functionName: 'ChoreScore-CreateChore',
    });
    choresTable.grantWriteData(createChoreFn);
    usersTable.grantReadData(createChoreFn);

    const updateChoreFn = new lambdaNodejs.NodejsFunction(this, 'UpdateChore', {
      ...commonLambdaProps,
      entry: path.join(lambdaDir, 'chores/update.ts'),
      functionName: 'ChoreScore-UpdateChore',
    });
    choresTable.grantReadWriteData(updateChoreFn);
    usersTable.grantReadData(updateChoreFn);

    const deleteChoreFn = new lambdaNodejs.NodejsFunction(this, 'DeleteChore', {
      ...commonLambdaProps,
      entry: path.join(lambdaDir, 'chores/delete.ts'),
      functionName: 'ChoreScore-DeleteChore',
    });
    choresTable.grantReadWriteData(deleteChoreFn);
    usersTable.grantReadData(deleteChoreFn);

    const completeChoreFn = new lambdaNodejs.NodejsFunction(this, 'CompleteChore', {
      ...commonLambdaProps,
      entry: path.join(lambdaDir, 'chores/complete.ts'),
      functionName: 'ChoreScore-CompleteChore',
    });
    choresTable.grantReadData(completeChoreFn);
    completionsTable.grantReadWriteData(completeChoreFn);
    usersTable.grantReadData(completeChoreFn);
    householdsTable.grantReadData(completeChoreFn);
    // Allow sending push notifications via Pinpoint
    // Pinpoint push permission added manually after activating Pinpoint in AWS console

    // ── Lambda: Scores ────────────────────────────────────────────────────────

    const getScoresFn = new lambdaNodejs.NodejsFunction(this, 'GetScores', {
      ...commonLambdaProps,
      entry: path.join(lambdaDir, 'scores/get.ts'),
      functionName: 'ChoreScore-GetScores',
    });
    completionsTable.grantReadData(getScoresFn);
    usersTable.grantReadData(getScoresFn);
    householdsTable.grantReadData(getScoresFn);

    // ── Lambda: History ───────────────────────────────────────────────────────

    const getHistoryFn = new lambdaNodejs.NodejsFunction(this, 'GetHistory', {
      ...commonLambdaProps,
      entry: path.join(lambdaDir, 'history/get.ts'),
      functionName: 'ChoreScore-GetHistory',
    });
    completionsTable.grantReadData(getHistoryFn);
    usersTable.grantReadData(getHistoryFn);

    const deleteCompletionFn = new lambdaNodejs.NodejsFunction(this, 'DeleteCompletion', {
      ...commonLambdaProps,
      entry: path.join(lambdaDir, 'history/delete.ts'),
      functionName: 'ChoreScore-DeleteCompletion',
    });
    completionsTable.grantWriteData(deleteCompletionFn);
    usersTable.grantReadData(deleteCompletionFn);

    const updateCompletionFn = new lambdaNodejs.NodejsFunction(this, 'UpdateCompletion', {
      ...commonLambdaProps,
      entry: path.join(lambdaDir, 'history/update.ts'),
      functionName: 'ChoreScore-UpdateCompletion',
    });
    completionsTable.grantReadWriteData(updateCompletionFn);
    usersTable.grantReadData(updateCompletionFn);

    // ── Lambda: Badges ────────────────────────────────────────────────────────

    const getBadgesFn = new lambdaNodejs.NodejsFunction(this, 'GetBadges', {
      ...commonLambdaProps,
      entry: path.join(lambdaDir, 'badges/get.ts'),
      functionName: 'ChoreScore-GetBadges',
    });
    completionsTable.grantReadData(getBadgesFn);
    usersTable.grantReadData(getBadgesFn);
    householdsTable.grantReadData(getBadgesFn);

    // ── API Gateway ───────────────────────────────────────────────────────────

    const api = new apigateway.RestApi(this, 'ChoreScoreApi', {
      restApiName: 'ChoreScore API',
      deployOptions: { stageName: 'prod' },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    const cognitoAuthorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'Authorizer', {
      cognitoUserPools: [userPool],
      authorizerName: 'ChoreScoreCognitoAuthorizer',
    });

    const auth = {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    };

    const fn = (fn: lambda.IFunction) => new apigateway.LambdaIntegration(fn);

    // /users/me
    const usersResource = api.root.addResource('users');
    const meMeResource = usersResource.addResource('me');
    meMeResource.addMethod('PUT', fn(updateUserFn), auth);

    // /household
    const householdResource = api.root.addResource('household');
    householdResource.addMethod('POST', fn(createHouseholdFn), auth);
    householdResource.addMethod('GET', fn(getHouseholdFn), auth);
    householdResource.addResource('join').addMethod('POST', fn(joinHouseholdFn), auth);

    // /chores
    const choresResource = api.root.addResource('chores');
    choresResource.addMethod('GET', fn(listChoresFn), auth);
    choresResource.addMethod('POST', fn(createChoreFn), auth);

    const choreResource = choresResource.addResource('{choreId}');
    choreResource.addMethod('PUT', fn(updateChoreFn), auth);
    choreResource.addMethod('DELETE', fn(deleteChoreFn), auth);
    choreResource.addResource('complete').addMethod('POST', fn(completeChoreFn), auth);

    // /scores
    api.root.addResource('scores').addMethod('GET', fn(getScoresFn), auth);

    // /history
    const historyResource = api.root.addResource('history');
    historyResource.addMethod('GET', fn(getHistoryFn), auth);
    const completionResource = historyResource.addResource('{completionId}');
    completionResource.addMethod('DELETE', fn(deleteCompletionFn), auth);
    completionResource.addMethod('PUT', fn(updateCompletionFn), auth);

    // /badges
    api.root.addResource('badges').addMethod('GET', fn(getBadgesFn), auth);

    // ── Outputs ───────────────────────────────────────────────────────────────

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID → EXPO_PUBLIC_COGNITO_USER_POOL_ID',
    });
    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito Client ID → EXPO_PUBLIC_COGNITO_CLIENT_ID',
    });
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL → EXPO_PUBLIC_API_URL',
    });
    // PinpointAppId output added after manually activating Pinpoint
  }
}
