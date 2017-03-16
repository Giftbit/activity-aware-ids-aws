import * as chai from "chai";
import * as messageDecoder from "./MessageDecoder";
import {SNSEvent} from "./LambdaEvents";
import {Message} from "./Message";

describe("MessageDecoder", () => {
    describe("decodeMessageFromSNSEvent()", () => {
        it("handles good input", () => {
            const event: SNSEvent = {
                "Records": [
                    {
                        "EventVersion": "1.0",
                        "EventSubscriptionArn": "some arn",
                        "EventSource": "aws:sns",
                        "Sns": {
                            "SignatureVersion": "1",
                            "Timestamp": "1970-01-01T00:00:00.000Z",
                            "Signature": "EXAMPLE",
                            "SigningCertUrl": "EXAMPLE",
                            "MessageId": "95df01b4-ee98-5cb9-9903-4c221d41eb5e",
                            "Message": "{\"subject\":\"Some subject\",\"fields\":[{\"key\":\"aKey\",\"value\":\"SomeValue\"}],\"metadata\":{\"sourceName\":\"ASource\",\"sourceIconUrl\":\"Some url\"}}",
                            "MessageAttributes": {},
                            "Type": "Notification",
                            "UnsubscribeUrl": "EXAMPLE",
                            "TopicArn": "some arn",
                            "Subject": "TestInvoke"
                        }
                    }
                ]
            };

            const pojo = {
                subject: "Some subject",
                fields: [
                    {
                        key: "aKey",
                        value: "SomeValue"
                    }
                ],
                metadata: {
                    sourceName: "ASource",
                    sourceIconUrl: "Some url" // Not checked
                },
                tags: []
            };

            const message: Message = messageDecoder.decodeMessageFromSNSEvent(event);

            chai.assert.deepEqual(JSON.parse(JSON.stringify(message)), pojo);
        });

        it("throws an error on missing required fields in message", () => {
            const event: SNSEvent = {
                "Records": [
                    {
                        "EventVersion": "1.0",
                        "EventSubscriptionArn": "some arn",
                        "EventSource": "aws:sns",
                        "Sns": {
                            "SignatureVersion": "1",
                            "Timestamp": "1970-01-01T00:00:00.000Z",
                            "Signature": "EXAMPLE",
                            "SigningCertUrl": "EXAMPLE",
                            "MessageId": "95df01b4-ee98-5cb9-9903-4c221d41eb5e",
                            "Message": "{\"fields\":[{\"key\":\"aKey\",\"value\":\"SomeValue\"}],\"metadata\":{\"sourceName\":\"ASource\",\"sourceIconUrl\":\"Some url\"}}",
                            "MessageAttributes": {},
                            "Type": "Notification",
                            "UnsubscribeUrl": "EXAMPLE",
                            "TopicArn": "some arn",
                            "Subject": "TestInvoke"
                        }
                    }
                ]
            };

            const decoding = () => { messageDecoder.decodeMessageFromSNSEvent(event); };
            chai.expect(decoding).to.throw(Error, "Missing Required Parameter 'subject'");
        });

        it("throws an error is the message is missing", () => {
            const event: any = {
                "Records": [
                    {
                        "EventVersion": "1.0",
                        "EventSubscriptionArn": "some arn",
                        "EventSource": "aws:sns",
                        "Sns": {
                            "SignatureVersion": "1",
                            "Timestamp": "1970-01-01T00:00:00.000Z",
                            "Signature": "EXAMPLE",
                            "SigningCertUrl": "EXAMPLE",
                            "MessageId": "95df01b4-ee98-5cb9-9903-4c221d41eb5e",
                            "MessageAttributes": {},
                            "Type": "Notification",
                            "UnsubscribeUrl": "EXAMPLE",
                            "TopicArn": "some arn",
                            "Subject": "TestInvoke"
                        }
                    }
                ]
            };

            const decoding = () => { messageDecoder.decodeMessageFromSNSEvent(event); };
            chai.expect(decoding).to.throw(SyntaxError);
        });

        it("throws an error is the SNS is missing", () => {
            const event: any = {
                "Records": [
                    {
                        "EventVersion": "1.0",
                        "EventSubscriptionArn": "some arn",
                        "EventSource": "aws:sns"
                    }
                ]
            };

            const decoding = () => { messageDecoder.decodeMessageFromSNSEvent(event); };
            chai.expect(decoding).to.throw(TypeError);
        });

        it("throws an error if there are no records", () => {
            const event: any = {
                "Records": []
            };

            const decoding = () => { messageDecoder.decodeMessageFromSNSEvent(event); };
            chai.expect(decoding).to.throw(TypeError);
        });
    });
});
