#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ChoreScoreStack } from '../lib/chore-score-stack';

const app = new cdk.App();

new ChoreScoreStack(app, 'ChoreScoreStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
  },
  description: 'ChoreScore — couple chore tracking app',
});
