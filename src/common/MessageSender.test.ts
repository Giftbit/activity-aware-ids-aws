import * as chai from "chai";
import {MessageSender} from "./MessageSender";
import {Message} from "./Message";

describe("MessageSender", () => {
    describe("preparePublishInput()", () => {
        it("handles good input", () => {
            const message = new Message({
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
                }
            });
            const messageSender = new MessageSender("some:fake:arn");

            const publishInput = messageSender.preparePublishInput(message);

            const expectedPublishInput = {
                Message: "{\"subject\":\"Some subject\",\"fields\":[{\"key\":\"aKey\",\"value\":\"SomeValue\"}],\"metadata\":{\"sourceName\":\"ASource\",\"sourceIconUrl\":\"Some url\"}}",
                TopicArn: "some:fake:arn"
            };

            chai.assert.deepEqual(publishInput, expectedPublishInput);
        });
    });
});
