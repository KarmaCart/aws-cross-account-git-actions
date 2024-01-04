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
                  `arn:aws:iam::${this.account}:role/cdk-hnb659fds-*`
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
