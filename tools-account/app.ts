#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { GitActionDeploymentUserStack } from './src/cdk-stack';
import fs from 'fs';

// Read parameter file
const params = JSON.parse(fs.readFileSync('src/cdk-stack-param.json', 'utf-8'))

// Create App
const app = new App();
// Deployment User Stack
new GitActionDeploymentUserStack(app, 'GitActionDeploymentUserStack', {
  description: 'Creates Cross Account Role and Cloudformation Execution Roles',
  stackName: 'cf-GitActionDeploymentUserStack',
  crossAccountRoleArn: params.CROSS_ACCOUNT_ROLE_ARN
});
