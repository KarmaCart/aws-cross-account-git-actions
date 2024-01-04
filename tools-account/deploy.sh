AWS_PROFILE=$1
export TARGET_ACCOUNT_NUMBER=$2

# Build
npm ci
npm run build

# Execute CDK commands
cdk bootstrap --profile $AWS_PROFILE

cdk diff --profile $AWS_PROFILE

cdk synth --profile $AWS_PROFILE

cdk deploy \* --require-approval never --profile $AWS_PROFILE