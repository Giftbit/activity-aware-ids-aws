import * as chai from "chai";
import {Message} from "../../common/Message";
import * as cloudTrailSource from "./index";

const testObject = {
    l1Primative: "l1primative",
    l1Object: {
        l2Primative: "l2primative",
        l2Object: {
            l3Primative: "l3primative"
        }
    }
};

describe("sources-cloudtrail-cloudwatch-logs", () => {
    describe("getValueFromObjectPath()", () => {
        it("depth 1 primative", () => {
            const value = cloudTrailSource.getValueFromObjectPath(testObject, "l1Primative");

            chai.assert.deepEqual(value, "l1primative");
        });

        it("depth 1 object", () => {
            const expected = {
                l2Primative: "l2primative",
                l2Object: {
                    l3Primative: "l3primative"
                }
            };

            const value = cloudTrailSource.getValueFromObjectPath(testObject, "l1Object");

            chai.assert.deepEqual(value, expected);
        });

        it("depth 2 primative", () => {
            const value = cloudTrailSource.getValueFromObjectPath(testObject, "l1Object.l2Primative");

            chai.assert.deepEqual(value, "l2primative");
        });

        it("depth 2 object", () => {
            const expected = {
                l3Primative: "l3primative"
            };

            const value = cloudTrailSource.getValueFromObjectPath(testObject, "l1Object.l2Object");

            chai.assert.deepEqual(value, expected);
        });

        it("depth 3 primative", () => {
            const value = cloudTrailSource.getValueFromObjectPath(testObject, "l1Object.l2Object.l3Primative");

            chai.assert.deepEqual(value, "l3primative");
        });
    });

    describe("messageFromSubjectAndFields", () => {
        it("handles good input", () => {
            const subject = "Some Subject";
            const fields = [
                {key: "field1", value: "value1"},
                {key: "field2", value: "value2"}
            ];

            const expected = new Message({
                subject: subject,
                fields: fields,
                metadata: {
                    sourceName: cloudTrailSource.SOURCE_NAME,
                    sourceIconUrl: cloudTrailSource.SOURCE_ICON_URL
                }
            });

            const message = cloudTrailSource.messageFromSubjectAndFields(subject, fields);

            chai.assert.deepEqual(message, expected);
        });
    });

    describe("prepareMessageFromCloudTrailRecord", () => {
        it("event includes error message", () => {
            // From http://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-log-file-examples.html#error-code-and-error-message
            const cloudtrailRecord = {
                "eventVersion": "1.04",
                "userIdentity": {
                    "type": "IAMUser",
                    "principalId": "EX_PRINCIPAL_ID",
                    "arn": "arn:aws:iam::123456789012:user/Alice",
                    "accountId": "123456789012",
                    "accessKeyId": "EXAMPLE_KEY_ID",
                    "userName": "Alice"
                },
                "eventTime": "2016-07-14T19:15:45Z",
                "eventSource": "cloudtrail.amazonaws.com",
                "eventName": "UpdateTrail",
                "awsRegion": "us-west-2",
                "sourceIPAddress": "205.251.233.182",
                "userAgent": "aws-cli/1.10.32 Python/2.7.9 Windows/7 botocore/1.4.22",
                "errorCode": "TrailNotFoundException",
                "errorMessage": "Unknown trail: myTrail2 for the user: 123456789012",
                "requestParameters": {"name": "myTrail2"},
                "responseElements": null,
                "requestID": "5d40662a-49f7-11e6-97e4-d9cb6ff7d6a3",
                "eventID": "b7d4398e-b2f0-4faa-9c76-e2d316a8d67f",
                "eventType": "AwsApiCall",
                "recipientAccountId": "123456789012"
            };

            const expected = new Message({
                subject: "Error Message: Unknown trail: myTrail2 for the user: 123456789012",
                fields: [
                    {key: "Error Message", value: "Unknown trail: myTrail2 for the user: 123456789012"},
                    {key: "Event", value: "UpdateTrail"},
                    {key: "Source", value: "cloudtrail.amazonaws.com"},
                    {key: "Recipient Account ID", value: "123456789012"},
                    {key: "User Account ID", value: "123456789012"},
                    {key: "Username", value: "Alice"},
                    {key: "User ARN", value: "arn:aws:iam::123456789012:user/Alice"},
                    {key: "Source IP", value: "205.251.233.182"},
                    {key: "Request Parameters", value: {"name": "myTrail2"}},
                ],
                metadata: {
                    sourceName: cloudTrailSource.SOURCE_NAME,
                    sourceIconUrl: cloudTrailSource.SOURCE_ICON_URL
                }
            });

            const message = cloudTrailSource.prepareMessageFromCloudTrailRecord(cloudtrailRecord);

            chai.assert.deepEqual(message, expected);
        });

        it("event does not include error message", () => {
            // From http://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-log-file-examples.html#error-code-and-error-message
            const cloudtrailRecord = {
                "eventVersion": "1.0",
                "userIdentity": {
                    "type": "IAMUser",
                    "principalId": "EX_PRINCIPAL_ID",
                    "arn": "arn:aws:iam::123456789012:user/Alice",
                    "accountId": "123456789012",
                    "accessKeyId": "EXAMPLE_KEY_ID",
                    "userName": "Alice"
                },
                "eventTime": "2014-03-24T21:11:59Z",
                "eventSource": "iam.amazonaws.com",
                "eventName": "CreateUser",
                "awsRegion": "us-east-1",
                "sourceIPAddress": "127.0.0.1",
                "userAgent": "aws-cli/1.3.2 Python/2.7.5 Windows/7",
                "requestParameters": {
                    "userName": "Bob"
                },
                "responseElements": {
                    "user": {
                        "createDate": "Mar 24, 2014 9:11:59 PM",
                        "userName": "Bob",
                        "arn": "arn:aws:iam::123456789012:user/Bob",
                        "path": "/",
                        "userId": "EXAMPLEUSERID"
                    }
                }
            };

            const expected = new Message({
                subject: "Event: CreateUser",
                fields: [
                    {key: "Event", value: "CreateUser"},
                    {key: "Source", value: "iam.amazonaws.com"},
                    {key: "User Account ID", value: "123456789012"},
                    {key: "Username", value: "Alice"},
                    {key: "User ARN", value: "arn:aws:iam::123456789012:user/Alice"},
                    {key: "Source IP", value: "127.0.0.1"},
                    {key: "Request Parameters", value:  {"userName": "Bob"}},
                ],
                metadata: {
                    sourceName: cloudTrailSource.SOURCE_NAME,
                    sourceIconUrl: cloudTrailSource.SOURCE_ICON_URL
                }
            });

            const message = cloudTrailSource.prepareMessageFromCloudTrailRecord(cloudtrailRecord);

            chai.assert.deepEqual(message, expected);
        });
    });

    describe("unpackCloudwatchLogsDecodedData", () => {
        it("handles good input", async () => {
            // Based on http://docs.aws.amazon.com/lambda/latest/dg/eventsources.html#eventsources-cloudwatch-logs
            const cloudwatchLogsEvent = {
                "awslogs": {
                    "data": "H4sICEybj1gAA3Rlc3QuanNvbgB9U01vm0AQvedXIM4BA8ZguCGHRFbsyKqdfrqy1uzirAos3V3qupH/e4ddPtIc6ostvzdv3sy8fb0x4GOWRAh0IrtLTczYMO+SXXJYp9tt8pCat5rCzhXhLeh6U38WhPPIcb0eLNjpgbOmbvFFwRq844gWkzuSo6aQqx4d2VvJCSrfyx3G2kMjrDMR0hp6iOYoMk5rSVl1TwtJuID6bwpUhBUqjxhp5UPSyJd70Gk4eWKS5hTMK+r30UT6i1TyX5HX4ZciUawsdhaGvyWFhUlUtvO6/hwmmIe+6zjOO1631lbjdW+Stt1HsA0D7M14b7q24+/N273ZCMKXGFAqL4AAV8IlFGeZrJ8BVbSa0yqjNSqWWGHp58Pmw/Jpsdwkq8PyTnEQ19rwHaOziCkq4/jtjuO22SQpaEZ0QZaxppKd5FtmD8MQj+Qy9EzWm1V6eEy/9C1bwSdUar+d8PW2m3dHO8Bz3MByQsv1d24Uu7PYn31V5Yq2ZQ3PNDFrMyDbDNioRH9YBWPYGStH8tDsucZIEpUXbfYsPpBTv94hQQoTqgOsCmMOE3WeZrY3c21vOrXduTdMk5ygi17jWVhZQSeu7Tr21DM2F/nCqolnh3ZkfKIVZmcxCY0jkyxjnADPtz0tRDhnfMGwtqpMQhLvYdk4/Z0RleORuNZR0WNVPyp4boZaQmyUF1XsGTnjhnwhRmsRgvf+VJz8bGDeDeKwn/Z56ChV/bZ6HX0dWELNKkHSgpTtMwBK1RTFqNNeF6pm2HeCwEOWH+VwPZcEVhQS38JRdgzyPMQBmo6n6YqOIfan0ZxYRy93LD9HyIqyMLCIh6dugOY4CPOxaNeHPTmLpKYLVBTdQJB2CoTkPxm9msObu+oHfnP9CwBbAyrWBAAA"
                }
            };

            const expected = {
                "messageType": "DATA_MESSAGE",
                "owner": "123456789012",
                "logGroup": "CloudTrail/DefaultLogGroup",
                "logStream": "123456789012_CloudTrail_us-west-2",
                "subscriptionFilters": [
                    "LambdaStream_AuthFailureNotifier"
                ],
                "logEvents": [
                    {
                        "id": "1",
                        "timestamp": 1482348741000,
                        "message": "{\"eventVersion\":\"1.04\",\"userIdentity\":{\"type\":\"IAMUser\",\"principalId\":\"EX_PRINCIPAL_ID\",\"arn\":\"arn:aws:iam::123456789012:user/Alice\",\"accountId\":\"123456789012\",\"accessKeyId\":\"EXAMPLE_KEY_ID\",\"userName\":\"Alice\"},\"eventTime\":\"2016-07-14T19:15:45Z\",\"eventSource\":\"cloudtrail.amazonaws.com\",\"eventName\":\"UpdateTrail\",\"awsRegion\":\"us-west-2\",\"sourceIPAddress\":\"205.251.233.182\",\"userAgent\":\"aws-cli/1.10.32 Python/2.7.9 Windows/7 botocore/1.4.22\",\"errorCode\":\"TrailNotFoundException\",\"errorMessage\":\"Unknown trail: myTrail2 for the user: 123456789012\",\"requestParameters\":{\"name\":\"myTrail2\"},\"responseElements\":null,\"requestID\":\"5d40662a-49f7-11e6-97e4-d9cb6ff7d6a3\",\"eventID\":\"b7d4398e-b2f0-4faa-9c76-e2d316a8d67f\",\"eventType\":\"AwsApiCall\",\"recipientAccountId\":\"123456789012\"}"
                    }
                ]
            };

            const message = await cloudTrailSource.unpackCloudWatchLogsDecodedData(cloudwatchLogsEvent);

            chai.assert.deepEqual(message, expected);
        });
    });
});
