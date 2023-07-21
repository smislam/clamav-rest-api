#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ClamavRestApiStack } from '../lib/clamav-rest-api-stack';

const app = new cdk.App();
new ClamavRestApiStack(app, 'ClamavRestApiStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }
});