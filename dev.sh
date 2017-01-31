#!/bin/bash

# Make the commands in this script relative to the script, not relative to where you ran them.
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $SCRIPT_DIR

set -x

# A few bash commands to make development against dev environment easy.
# Set the two properties below to sensible values for your project.

# The name of your CloudFormation stack.  Two developers can share a stack by
# sharing this value, or have their own with different values.
if [ -z "$STACK_NAME" ]; then
    STACK_NAME="Activity-Aware-IDS-Dev"
fi

# The name of an S3 bucket on your account to hold deployment artifacts.
if [ -z "$BUILD_ARTIFACT_BUCKET" ]; then
    BUILD_ARTIFACT_BUCKET="activity-aware-ids-aws-dev"
fi

if ! type "aws" &> /dev/null; then
    echo "'aws' was not found in the path.  Install awscli using 'sudo pip install awscli' then try again."
    exit 1
fi

if ! type "npm" &> /dev/null; then
    echo "'npm' was not found in the path.  Please follow the instruction at https://docs.npmjs.com/getting-started/installing-node then try again."
    exit 1
fi

COMMAND="$1"

if [ "$COMMAND" = "build" ]; then
    # Build one or more lambda functions.
    # eg: ./dev.sh build destinations-slack sources-cloudtrail-cloudwatch-logs
    # eg: ./dev.sh build

    BUILD_ARGS=""
    for ((i=2;i<=$#;i++)); do
        BUILD_ARGS="$BUILD_ARGS --fxn=${!i}";
    done

    npm run build -- $BUILD_ARGS

elif [ "$COMMAND" = "delete" ]; then
    aws cloudformation delete-stack --stack-name $STACK_NAME

    if [ $? -ne 0 ]; then
        # Print some help on why it failed.
        echo ""
        echo "Printing recent CloudFormation errors..."
        aws cloudformation describe-stack-events --stack-name $STACK_NAME --query 'reverse(StackEvents[?ResourceStatus==`CREATE_FAILED`||ResourceStatus==`UPDATE_FAILED`].[ResourceType,LogicalResourceId,ResourceStatusReason])' --output text
    fi

elif [ "$COMMAND" = "deploy" ] || [ "$COMMAND" = "package" ] || [ "$COMMAND" = "create" ]; then
    # Deploy all code and update the CloudFormation stack.
    # eg: ./dev.sh deploy [args]
    # eg: aws-profile infrastructure_admin ./deploy.sh [args]

    # Package all code to be deployed to CloudFormation later using an S3 url.
    # eg: ./dev.sh package
    # eg: aws-profile infrastructure_admin ./deploy.sh

    aws cloudformation package --template-file infrastructure/cloudformation.yaml --s3-bucket $BUILD_ARTIFACT_BUCKET --s3-prefix lambdas --output-template-file /tmp/Activity-Aware-IDS.yaml
    if [ $? -ne 0 ]; then
        exit 1
    fi

    if [ "$COMMAND" = "deploy" ]; then
        echo "Executing aws cloudformation deploy..."
        aws cloudformation deploy --template-file /tmp/Activity-Aware-IDS.yaml --stack-name $STACK_NAME --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM ${@:2}

        if [ $? -ne 0 ]; then
            # Print some help on why it failed.
            echo ""
            echo "Printing recent CloudFormation errors..."
            aws cloudformation describe-stack-events --stack-name $STACK_NAME --query 'reverse(StackEvents[?ResourceStatus==`CREATE_FAILED`||ResourceStatus==`UPDATE_FAILED`].[ResourceType,LogicalResourceId,ResourceStatusReason])' --output text
        fi
    elif [ "$COMMAND" = "create" ]; then
        SLACK_WEBHOOK=$2

        if [ -z "$SLACK_WEBHOOK" ]; then
            echo "Missing Parameter Slack Webhook URL provided."
            echo ""
            echo "Input should be in the form:"
            echo "./dev.sh create <webhook_url>"
            exit 2
        elif [ "$SLACK_WEBHOOK" = "https*" ]; then
            echo "Invalid Slack Webhook URL provided."
            echo ""
            echo "Slack Webhooks should start with https"
        fi

        timestamp=$(date +"%Y%m%d-%H%M")

        echo "Executing aws cloudformation create..."
        change_set_id=$(aws cloudformation create-change-set --template-body file:///tmp/Activity-Aware-IDS.yaml --stack-name $STACK_NAME --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM --change-set-name "$BUILD_ARTIFACT_BUCKET-$timestamp" --change-set-type CREATE --parameters ParameterKey=SlackWebhookURL,ParameterValue=$SLACK_WEBHOOK ParameterKey=CloudTrailCloudWatchLogsGroupName,ParameterValue="" --query "Id" --output text)

        change_set_status=$(aws cloudformation describe-change-set --change-set-name $change_set_id --query Status --output text)
        while [[ "$change_set_status" == "CREATE_IN_PROGRESS" ]]
        do
            sleep 1
            change_set_status=$(aws cloudformation describe-change-set --change-set-name $change_set_id --query Status --output text)
        done

        aws cloudformation execute-change-set --change-set-name $change_set_id
    else
        timestamp=$(date +"%Y%m%d-%H%M")

        echo "Packaging CloudFormation Template for consumption..."
        aws s3 cp /tmp/Activity-Aware-IDS.yaml s3://$BUILD_ARTIFACT_BUCKET/cloudformation/$timestamp.yaml

        echo ""
        echo "The Packaged template has been made available at:"
        echo "https://$BUILD_ARTIFACT_BUCKET.s3.amazonaws.com/cloudformation/$timestamp.yaml"
    fi

    # cleanup
    rm /tmp/Activity-Aware-IDS.yaml

elif [ "$COMMAND" = "invoke" ]; then
    # Invoke a lambda function.
    # eg: ./sam.sh invoke myfunction myfile.json

    FXN="$2"
    JSON_FILE="$3"

    if [ "$#" -ne 3 ]; then
        echo "Supply a function name to invoke and json file to invoke with.  eg: $0 invoke myfunction myfile.json"
        exit 1
    fi

    if [ ! -d "./src/lambdas/$FXN" ]; then
        echo "$FXN is not the directory of a lambda function in src/lambdas."
        exit 2
    fi

    if [ ! -f $JSON_FILE ]; then
        echo "$JSON_FILE does not exist."
        exit 3
    fi

    # Search for the ID of the function assuming it was named something like FxnFunction where Fxn is the uppercased form of the dir name.
    SED_COMMAND="sed"
    if ! sed --version 2>&1 | grep "GNU sed" &> /dev/null; then
        if ! type "gsed" &> /dev/null; then
            echo "You appear to not be using an up to date version of GNU sed."
            echo "If you are on a Mac, you can install this using:"
            echo "'brew install gsed'"
            exit 4
        fi
        SED_COMMAND="gsed"
    fi

    FXN_RESOURCE_PREFIX=$(echo $FXN | $SED_COMMAND -r 's/(^|-)([a-z])/\U\2/g')
    FXN_ID="$(aws cloudformation describe-stack-resources --stack-name $STACK_NAME --query "StackResources[?ResourceType==\`AWS::Lambda::Function\`&&starts_with(LogicalResourceId,\`$FXN_RESOURCE_PREFIX\`)].PhysicalResourceId" --output text)"
    if [ $? -ne 0 ]; then
        echo "Could not discover the LogicalResourceId of $FXN.  Check that there is a ${FXN_RESOURCE_PREFIX}Function Resource inside infrastructure/sam.yaml and check that it has been deployed."
        exit 1
    fi

    aws lambda invoke --function-name $FXN_ID --payload fileb://$JSON_FILE /dev/stdout

elif [ "$COMMAND" = "upload" ]; then
    # Upload new lambda function code.
    # eg: ./sam.sh upload myfunction

    FXN="$2"

    if [ "$#" -ne 2 ]; then
        echo "Supply a function name to build and upload.  eg: $0 upload myfunction"
        exit 1
    fi

    if [ ! -d "./src/lambdas/$FXN" ]; then
        echo "$FXN is not the directory of a lambda function in src/lambdas."
        exit 2
    fi

    npm run build -- --fxn=$FXN
    if [ $? -ne 0 ]; then
        exit 1
    fi

    # Search for the ID of the function assuming it was named something like FxnFunction where Fxn is the uppercased form of the dir name.
    SED_COMMAND="sed"
    if ! sed --version 2>&1 | grep "GNU sed" &> /dev/null; then
        if ! type "gsed" &> /dev/null; then
            echo "You appear to not be using an up to date version of GNU sed."
            echo "If you are on a Mac, you can install this using:"
            echo "'brew install gsed'"
            exit 4
        fi
        SED_COMMAND="gsed"
    fi

    FXN_RESOURCE_PREFIX=$(echo $FXN | $SED_COMMAND -r 's/(^|-)([a-z])/\U\2/g')
    FXN_ID="$(aws cloudformation describe-stack-resources --stack-name $STACK_NAME --query "StackResources[?ResourceType==\`AWS::Lambda::Function\`&&starts_with(LogicalResourceId,\`$FXN_RESOURCE_PREFIX\`)].PhysicalResourceId" --output text)"
    if [ $? -ne 0 ]; then
        echo "Could not discover the LogicalResourceId of $FXN.  Check that there is a ${FXN_RESOURCE_PREFIX}Function Resource inside infrastructure/sam.yaml and check that it has been deployed."
        exit 1
    fi

    aws lambda update-function-code --function-name $FXN_ID --zip-file fileb://./dist/$FXN/$FXN.zip

else
    echo "Error: unknown command name '$COMMAND'."
    echo "  usage: $0 <command name>"
    echo "Valid command names: build deploy package invoke"
    exit 2

fi
