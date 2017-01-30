#!/bin/bash

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $SCRIPT_DIR/..

# Deploy all code and update the CloudFormation stack.
# eg: ./deploy.sh
# eg: aws-profile infrastructure_admin ./deploy.sh

BUILD_ARTIFACT_BUCKET="giftbit-public-resources"
BUILD_ARTIFACT_PREFIX="cloudformation/aws-activity-aware"
timestamp=$(date +"%Y%m%d-%H%M")

aws cloudformation package --template-file infrastructure/cloudformation.yaml --s3-bucket $BUILD_ARTIFACT_BUCKET --s3-prefix $BUILD_ARTIFACT_PREFIX/lambdas --output-template-file /tmp/AWS-Activity-Aware.yaml > /dev/null

aws s3 cp /tmp/AWS-Activity-Aware.yaml s3://$BUILD_ARTIFACT_BUCKET/$BUILD_ARTIFACT_PREFIX/cloudformation/$timestamp.yaml

echo ""
echo "The Packaged template has been made available at:"
echo "https://$BUILD_ARTIFACT_BUCKET.s3.amazonaws.com/$BUILD_ARTIFACT_PREFIX/cloudformation/$timestamp.yaml"

echo "Execute the following command to deploy the packaged template"
echo "scripts/deploy.sh $timestamp"
