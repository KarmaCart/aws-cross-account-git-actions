/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ArnPrincipal, Effect, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';

/**
 * Custom properties to accommodate list of code deployment buckets across different regions
 */
interface EnvProps extends StackProps{
  toolsAccountUserArn: string;
}

export class CrossAccountRolesStack extends Stack {
  constructor(scope: Construct, id: string, props?: EnvProps) {
    super(scope, id, props);

    // Create Cloudformation Execution Role
    const cfExecutionRole = new Role(
      this,
      'GitActionsCFExecutionRole',
      {
        assumedBy: new ServicePrincipal('cloudformation.amazonaws.com'),
        description: 'Role assumed by cloudformation service while creating the required resources',
        roleName: 'git-action-cf-execution-role',
        inlinePolicies: {
          CFExecutionPolicy: new PolicyDocument({
            assignSids: true,
            statements: [
              new PolicyStatement({
                actions: [
                  'iam:Get*',
                  'iam:List*',
                  'iam:*Role*',
                  'iam:CreatePolicy',
                  'iam:DeletePolicy',
                  'iam:*PolicyVersion*',
                  'iam:*InstanceProfile*'
                ],
                effect: Effect.ALLOW,
                resources: [
                  '*'
                ]
              }),
              new PolicyStatement({
                actions: [
                  's3:*'
                ],
                effect: Effect.ALLOW,
                resources: [
                  '*'
                ]
              }),
              new PolicyStatement({
                actions: [
                  'cloudformation:*'
                ],
                effect: Effect.ALLOW,
                resources: [
                  '*'
                ]
              }),
              new PolicyStatement({
                actions: [
                  'lambda:*'
                ],
                effect: Effect.ALLOW,
                resources: [
                  '*'
                ]
              }),
              new PolicyStatement({
                actions: [
                  'apigateway:*'
                ],
                effect: Effect.ALLOW,
                resources: [
                  '*'
                ]
              }),
              new PolicyStatement({
                actions: [
                  'ssm:GetParameter',
                  'ssm:GetParameters'
                ],
                effect: Effect.ALLOW,
                resources: [
                  '*'
                ]
              })
            ]
          })
        }
      }
    )

    // Create a cross account role
    const crossAccountRole = new Role(
      this,
      'CrossAccountRole',
      {
        assumedBy: new ArnPrincipal(String(props?.toolsAccountUserArn)),
        description: 'Cross account role to be assumed by Raven tools account. Used for CICD deployments only.',
        roleName: 'git-action-cross-account-role',
        inlinePolicies: {
          CrossAccountPolicy: new PolicyDocument({
            assignSids: true,
            statements: [
              new PolicyStatement({
                actions: [
                  'iam:PassRole'
                ],
                effect: Effect.ALLOW,
                resources: [
                  cfExecutionRole.roleArn
                ]
              }),
              new PolicyStatement({
                actions: [
                  's3:List*'
                ],
                effect: Effect.ALLOW,
                resources: [
                  '*'
                ]
              }),
              new PolicyStatement({
                actions: [
                  's3:*'
                ],
                effect: Effect.ALLOW,
                resources: [
                  // This is staging bucket created by CDKToolkit stack when CDK app is bootstrapped
                  'arn:aws:s3:::cdktoolkit-stagingbucket-*',
                  'arn:aws:s3:::cdktoolkit-stagingbucket-*/*'
                ]
              }),
              new PolicyStatement({
                actions: [
                  'cloudformation:*'
                ],
                effect: Effect.ALLOW,
                resources: [
                  '*'
                ]
              }),
              new PolicyStatement({
                actions: [
                  'ssm:GetParameter'
                ],
                effect: Effect.ALLOW,
                resources: [
                  '*'
                ]
              }),
              new PolicyStatement({
                actions: [
                  'sts:AssumeRole'
                ],
                effect: Effect.ALLOW,
                resources: [
                  'arn:aws:iam::740207786562:role/cdk-hnb659fds-*'
                ]
              })
            ]
          })
        }
      }
    );

    // STS Session Tagging Permission
    const sessionTaggingPolicy = new PolicyStatement()
    sessionTaggingPolicy.addPrincipals(new ArnPrincipal(String(props?.toolsAccountUserArn)));
    sessionTaggingPolicy.addActions('sts:TagSession');
    sessionTaggingPolicy.effect = Effect.ALLOW;
    crossAccountRole.assumeRolePolicy?.addStatements(sessionTaggingPolicy)

    /*********************************** List of Outputs ************************************/
    new CfnOutput(
      this,
      'CFExecutionRoleArn',
      {
        description: 'Cloudformation Execution Role ARN',
        exportName: 'GIT-ACTIONS-CF-EXECUTION-ROLE-ARN',
        value: cfExecutionRole.roleArn
      }
    )

    new CfnOutput(
      this,
      'CrossAccountRoleArn',
      {
        description: 'Cross Account Role ARN',
        exportName: 'GIT-ACTIONS-CROSS-ACCOUNT-ROLE-ARN',
        value: crossAccountRole.roleArn
      }
    )
    /****************************************************************************************/
  }
}
