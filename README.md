# Activity Aware IDS for AWS

Activity Aware IDS for AWS is a system for gaining greater visibility into your AWS Account.

When performing day-to-day operations and maintaining the security of your AWS account, it's important to stay aware of
the activities being performed in your AWS account. AWS Activity Aware provides an integral part of of an overall
intrusion detection and awareness strategy by gathering important information about the activities in your AWS account,
and bringing them to your team in the context that makes the most sense for them, such as Slack.

In our initial release, we support CloudWatch Logs CloudTrail source, and the Slack destination, with plan to add
additional sources and destinations in the future.


## Table of Contents

1. [Use Cases](#use-cases)
2. [Getting Started](#getting-started)
3. [Contributing](#contributing)
4. [Development](#development)
5. [Notices](#notices)


## Use Cases

### Intrusion Detection

According to the security team at Adobe, there are
[3 major types of potential security incidents in AWS](http://www.slideshare.net/AmazonWebServices/you-cant-protect-what-you-cant-see-aws-security-monitoring-compliance-validation-from-adobe-sac309#9).
These are:

* Infrastructure Impact
  * Externally attacking the infrastructure to impact system performance, such as Distributed Denial of Service (DDoS)
  attacks.
* Host Compromise
  * Taking control of existing resources such as Instances using techniques like command injection.
* Account Compromise
  * Taking control of an authenticated AWS User to seize account control.

Activity Aware IDS for AWS currently focuses mainly on helping you identify potential Account Compromise activities.

For an example of how this works, imagine that you have a AWS Account IAM User named Alice, and a Malicious user named
Mallory that is trying to perform actions in your account.

Alice has a set of long term credentials that give her access to a specific aspect of the AWS Account. Now suppose that
Alice's credentials get compromised in some way by some malicious user Mallory. At some point Mallory will likely try
to find out what she is able to do in this account, by either looking for policies that the user has, or by attempting
a number of actions to see what isn't denied.

If you are following a Least Privilege approach to managing your IAM accounts, Alice likely doesn't need to see the
actions afforded to her by the Policies attached to our account, or potentially, even what policies are attached to her
account. If this is the case, when Mallory attempts to get the contents of an IAM Policy, she will be denied access,
and a CloudTrail log for this denial will be created.

This is where Activity Aware IDS for AWS can help. In our default configuration, once CloudTrail logs the denial to the
CloudWatch Logs Log Group, the CloudTrail Source will receive that message, pass a standardized version of it to the
Slack Destination, which will send a notification to its configured Slack Channel. At this point your team can choose
to get notifications on any activity in this channel. Once the team notices the odd activity, they will likely speak
with Alice, and identify that the actions were not performed by her, and replace her credentials.

### Least Privilege Debugging

Following the Principle of Least Privilege is a common recommendation for protecting your account. Finding the right
set of permissions to give an account or role can be difficult.

For example, imagine that you are creating a new role for one of your services. When determining the minimum permissions
that the role needs, one approach is to start with no permissions, and interact with the system until it is denied
access to perform an action. At this point, like in the [Intrusion Detection](#intrusion-detection) example above, a
CloudTrail log for this denial will be created. In the default configuration of Activity Aware IDS for AWS, once
CloudTrail logs the denial to the CloudWatch Logs Log Group, the CloudTrail Source will receive that message, and pass a
standardized version to the Slack Destination, which will send a notification to its configured Slack Channel. At this
point, you can review the denied action, and resource, and add these to the permissions of the role.

## Getting Started

### Requirements

To receive Cloudtrail Events, Activity Aware IDS for AWS requires that 
[CloudWatch Logs support in Cloudtrail](http://docs.aws.amazon.com/awscloudtrail/latest/userguide/send-cloudtrail-events-to-cloudwatch-logs.html)
has been enabled.

To send notifications to Slack, you will need a
[Slack Webhook URL](https://slack.com/apps/A0F7XDUAZ-incoming-webhooks).

### Configuration

#### CloudTrailCloudWatchLogsGroupName

This specifies the CloudWatch Logs Log Group from your account that you would like Activity Aware IDS to monitor the
CloudTrail events in your account.

Default: `CloudTrail/DefaultLogGroup`

The default is set to the default used by CloudTrail when sending logs to CloudWatch Logs.

#### CloudTrailCloudWatchLogsFilterPattern

This specifies the CloudWatch Logs [Filter Pattern][filter and pattern syntax] for events you would like the CloudTrail
Source to receive. More detail on the filter format can be found in the
[Filter and Pattern Syntax][filter and pattern syntax] documentation.

Default: `{ ($.errorCode = "*UnauthorizedOperation") || ($.errorCode = "AccessDenied*") }`

The Default value will send you alerts whenever an access denied error is logged by CloudTrail.

Additional examples of common filter patterns for specific CloudTrail events can be found in the
[CloudWatch Alarms for CloudTrail][cloudtrail alarms] documentation.

[filter and pattern syntax]: http://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/FilterAndPatternSyntax.html
[cloudtrail alarms]: http://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudwatch-alarms-for-cloudtrail.html

### CloudFormation Quick Install

We have packaged the lambda functions with a build of a CloudFormation template that will enable you to quickly install
Activity Aware IDS for AWS. This will install all of the required Lambda functions, set up the required infrastructure
and permissions, and wire up the events between the infrastructure, and the lambda functions.

[![Launch Giftbit AWS Activity Aware using CloudFormation](https://s3.amazonaws.com/cloudformation-examples/cloudformation-launch-stack.png)](https://console.aws.amazon.com/cloudformation/home?#/stacks/new?stackName=Activity-Aware-IDS&templateURL=https://activity-aware-ids-aws.s3.amazonaws.com/cloudformation/20170206-1536.yaml)

### Custom Installation

If you want to customize your installation, you can do so by following the [Building](#building) and
[Packaging](#packaging) sections of the [Development](#development) section below.


## Contributing

We'd love for you to help improve Activity Aware IDS for AWS. We suggest checking out our
[Contributing Guide](https://github.com/Giftbit/activity-aware-ids-aws/blob/master/CONTRIBUTING.md), as it will improve
the likelihood of a successful contribution, and therefore a good experience.

If you find an issue with Activity Aware IDS for AWS or you'd like to make a code contribution, please create an issue
for it, so that we might be able to offer guidance or suggestions to improve your experience.


## Development

```
.
├── infrastructure
│   └── cloudformation.yaml
├── dev.sh
└── src
    ├── common
    │   └── ...
    └── lambdas
        └── ...
```

AWS Activity Aware IDS for AWS is comprised mainly of lambda functions (inside `src/lambdas`) and their connection with
other AWS Resources (defined by the CloudFormation Template `infrastructure/cloudformation.yaml`). The lambda functions
themselves are split into two types: **Sources** and **Destinations**.

**Sources** are the recipient functions of events in an AWS account. They take these events, like CloudTrail, and
convert them into a standardized message format expected by the destination lambdas.

**Destinations** receive the standardized messages, and convert it into the format for a specific destination, then
handle the distribution of these to the specific systems, suck as Slack.

### Building

Compile the project with:

`./dev.sh build`

Each of the lambda functions in `src/lambdas` will be build separately and packaged with it's dependencies in a zip file
in the `dist` folder. Only the source code, and dependencies referenced by each lambda will be included.

### Creating a Dev Stack

Once you've performed a build, create a Development CloudFormation stack using

`./dev.sh create`.

This creates a new Stack called `Activity-Aware-IDS-Dev`. You should never develop against your primary
`Activity-Aware-IDS` stack, as you may miss important events that occur on your account.

### Invoking a Source Function

While performing Development, it's frequently helpful to be able to invoke your sources to ensure that the proper
behavior occurs. You can do this by running

`./dev.sh invoke <function_directory_name> <json file to invoke with>`

This will execute the lambda, as though an event with the given json just occurred. Your source should then standardize
the event into a message which it will pass to your destinations.

### Deploying

As you make changes to your resources, you can deploy these changes to your CloudFormation stack using

`./dev.sh deploy`

This takes the current distribution resources, and the CloudFormation template, packages them, and then updates the
stack with the new template.

### Updating a function

As you're developing in Activity Aware IDS, you may want to update just a single function as deploying the
CloudFormation template will likely involve updating all the functions, and this will take a greater about of time.

To deploy a specific function you can run

`./dev.sh upload <function_name>`

This will build this function, package the deployment package, and update the associated function, without updating the
other CloudFormation resources.

### Packaging

To package the functions, as well as the CloudFormation template, you can run

`./dev.sh package`

This packages the lambda functions, deploys them to S3 artifact bucket, generates a CloudFormation template with the
Lambda deployment package resources, and finally uploads the CloudFormation template to S3.

By packaging the resources, it allows for easily creating CloudFormation Stacks in multiple accounts, such as we have
demonstrated in [CloudFormation Quick Install](#cloudformation-quick-install).

## Notices

This software the
[CloudFormation KMS Custom Resource by Benjamin D. Jones](https://github.com/Giftbit/lambda-backed-cloud-formation-kms-encryption)
to encrypt the Slack Webhook URL. See
[library-license.txt](https://github.com/Giftbit/giftbit-aws-activity-aware/blob/master/library-license.txt).
