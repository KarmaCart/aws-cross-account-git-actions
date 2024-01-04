import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { CrossAccountRolesStack } from './src/cdk-stack';
import fs from 'fs';

// Read parameter file
const params = JSON.parse(fs.readFileSync('src/cdk-stack-param.json', 'utf-8'));
// Insert the provided Tools account number
const toolsAccountUserArn = params.TOOLS_ACCOUNT_USER_ARN.replace('${TOOLS_ACCOUNT_NUMBER}', process.env.TOOLS_ACCOUNT_NUMBER);

// Create App
const app = new App();
// IAM Roles Stack
new CrossAccountRolesStack(app, 'CrossAccountRolesStack', {
  description: 'Creates Cross Account Role and Cloudformation Execution Roles',
  stackName: 'cf-CrossAccountRolesStack',
  toolsAccountUserArn: toolsAccountUserArn
});
