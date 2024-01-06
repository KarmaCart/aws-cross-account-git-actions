# aws-cross-account-git-actions
This repo contains the cdk infrastructure to enable cross account deploys from a Tools AWS account to a Target AWS account using GitHub Actions.

It was forked from [this repo](https://github.com/awslabs/aws-cross-account-cicd-git-actions-prereq) and converted to use cdk v2 (Along with some fixes to the role structures missing in the original repo).

The original guide for cross account deploys using the cdk and GitHub actions located [here](https://aws.amazon.com/blogs/devops/cross-account-and-cross-region-deployment-using-github-actions-and-aws-cdk/).

## Usage

Initialize profile in .aws/credentials (Remember to specify the region).

```cd tools-account```

```./deploy.sh [TOOLS_PROFILE] TARGET_ACCOUNT_NUMBER```

THEN

```cd ../target-account```

```./deploy.sh [TARGET_PROFILE] TOOLS_ACCOUNT_NUMBER```