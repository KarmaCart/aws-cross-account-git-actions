import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CfnAccessKey, Effect, Policy, PolicyStatement, User } from 'aws-cdk-lib/aws-iam';
import { CfnSecret } from 'aws-cdk-lib/aws-secretsmanager';

/**
 * Custom properties to define cross account deployment role
 */
interface EnvProps extends StackProps{
  crossAccountRoleArn: string;
}

export class GitActionDeploymentUserStack extends Stack {
  constructor(scope: Construct, id: string, props?: EnvProps) {
    super(scope, id, props);

    // Create IAM User
    // Git action will piggy back on this IAM User and assume cross account role for deployment. 
    const deploymentUser = new User(
      this,
      'GitActionDeploymentUser',
      {
        userName: 'git-action-deployment-user'
      }
    )

    // IAM policy for deployment user
    deploymentUser.attachInlinePolicy(
      new Policy(
        this,
        'GitActionDeploymentUserPolicy',
        {
          statements: [
            new PolicyStatement({
              sid: 'CrossAccountAssumeRole',
              actions: [
                'sts:AssumeRole'
              ],
              effect: Effect.ALLOW,
              resources: [
                String(props?.crossAccountRoleArn)
              ]
            }),
            new PolicyStatement({
              sid: 'STSSessionTagging',
              actions: [
                'sts:TagSession'
              ],
              effect: Effect.ALLOW,
              resources: [
                '*'
              ]
            })
          ]
        }
      )
    )

    // Access Key for the user
    const accessKey = new CfnAccessKey(
      this,
      'GitActionDeploymentUserAccessKey',
      {
        userName: deploymentUser.userName
      }
    )

    // Secret for the user will be stored in secret manager
    const secret = new CfnSecret(
      this,
      'GitActionDeploymentUserSecret',
      {
        name: 'git-action-deployment-user-secret',
        description: 'Secret for the git action deployment user',
        secretString: String(accessKey.getAtt('SecretAccessKey'))
      }
    )

    /*********************************** List of Outputs ************************************/
    new CfnOutput(
      this,
      'OutGitActionDeploymentUserArn',
      {
        description: 'Git action deployment user arn',
        exportName: 'GIT-ACTIONS-DEPLOYMENT-USER-ARN',
        value: deploymentUser.userArn
      }
    )

    new CfnOutput(
      this,
      'OutGitActionDeploymentUserAccessKey',
      {
        description: 'Access key for git action deployment user',
        exportName: 'GIT-ACTIONS-DEPLOYMENT-USER-ACCESS-KEY',
        value: accessKey.ref
      }
    )

    new CfnOutput(
      this,
      'OutGitActionDeploymentUserSecretArn',
      {
        description: 'User secret for git action deployment user',
        exportName: 'GIT-ACTIONS-DEPLOYMENT-USER-SECRET-ARN',
        value: secret.ref
      }
    )
    /****************************************************************************************/
  }
}
