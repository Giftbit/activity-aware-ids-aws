# Activity Aware IDS for AWS

Activity Aware IDS for AWS is a system for gaining greater visibility into your AWS Account. 

When performing day-to-day operations and maintaining the security of your AWS account, it's important to stay aware of
the activities being performed in your AWS account. AWS Activity Aware provides an integral part of of an overall
intrusion detection and awareness strategy by gathering important information about the activities in your AWS account,
and bringing them to your team in the context that makes the most sense for them, such as Slack.

At its heart Activity Aware IDS for AWS is a series of specialized lambda functions. These functions fall into two different
groups: **Sources** are functions that receive notifications for specific types of events, like CloudTrail, standardize
this information; and **Destinations**, functions that receive the standardized information, and distribute them
to specific places, such as Slack.

In our initial release, we support CloudWatch Logs CloudTrail source, and the Slack destination.


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


## Requirements

We assume that you already have CloudTrail installed and set up, and that you have configured
[CloudTrail logs to push to CloudWatch Logs](http://docs.aws.amazon.com/awscloudtrail/latest/userguide/send-cloudtrail-events-to-cloudwatch-logs.html).

You will also need a [Slack Webhook URL](https://slack.com/apps/A0F7XDUAZ-incoming-webhooks) that will be used to
notify your Slack channel.

## Installing Activity Aware IDS for AWS

### CloudFormation Quick Install

If you want to get started quickly, you can use CloudFormation to quickly bootstrap your infrastructure. 

[![Launch Giftbit AWS Activity Aware using CloudFormation](https://s3.amazonaws.com/cloudformation-examples/cloudformation-launch-stack.png)](https://console.aws.amazon.com/cloudformation/home?#/stacks/new?stackName=AWS-Activity-Aware&templateURL=https://s3-us-west-2.amazonaws.com/giftbit-public-resources/cloudformation/aws-activity-aware/cloudformation/20161223-1823.yaml)

### Full Installation

If you want to get more into the details of what this system is doing (and I think it's worthwhile to do so), you can
check out the
[CloudFormation Template](https://github.com/Giftbit/giftbit-aws-activity-aware/blob/master/aws-activity-aware.yaml).
We'd recommend that if you're going to deploy this on your own infrastructure, you should use some form of automation
to do this, and this template should give you a good starting point.

## Contributing

We'd love for you to help improve Activity Aware IDS for AWS. If you find an issue with Activity Aware IDS for AWS or
you'd like to make a code contribution, please create an issue for it, so that we might be able to offer guidance or
suggestions to improve your experience.

## Notices

This software the
[CloudFormation KMS Custom Resource by Benjamin D. Jones](https://github.com/Giftbit/lambda-backed-cloud-formation-kms-encryption)
to encrypt the Slack Webhook URL. See
[library-license.txt](https://github.com/Giftbit/giftbit-aws-activity-aware/blob/master/library-license.txt).
