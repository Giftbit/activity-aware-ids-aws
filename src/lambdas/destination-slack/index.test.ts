import * as chai from "chai";
import {Message} from "../../common/Message";
import * as slackDestination from "./index";

describe("destinations-slack", () => {
    describe("preparePostBody()", () => {
        it("handles good input", () => {
            const message = new Message({
                subject: "Some subject",
                fields: [
                    {
                        key: "AKey",
                        value: "SomeValue"
                    },
                    {
                        key: "AnotherKey",
                        value: "SomeOtherValue"
                    }
                ],
                metadata: {
                    sourceName: "ASource",
                    sourceIconUrl: "Some url" // Not checked
                }
            });

            const expectedPostBody = {
                username: "ASource",
                color: "danger",
                icon_url: "Some url",
                text: "AKey: SomeValue\nAnotherKey: SomeOtherValue"
            };

            const postBody = slackDestination.preparePostBody(message);


            chai.assert.deepEqual(postBody, expectedPostBody);
        });

        it("jsonifies objects", () => {
            const message = new Message({
                subject: "Some subject",
                fields: [
                    {
                        key: "AKey",
                        value: "SomeValue"
                    },
                    {
                        key: "AnotherKey",
                        value: {
                            "SomeSubKey": "SomeSubValue",
                            "AnotherSubKey": "AnotherSubValue"
                        }
                    }
                ],
                metadata: {
                    sourceName: "ASource",
                    sourceIconUrl: "Some url" // Not checked
                }
            });

            const expectedPostBody = {
                username: "ASource",
                color: "danger",
                icon_url: "Some url",
                text: "AKey: SomeValue\nAnotherKey: {\n  \"SomeSubKey\": \"SomeSubValue\",\n  \"AnotherSubKey\": \"AnotherSubValue\"\n}"
            };

            const postBody = slackDestination.preparePostBody(message);


            chai.assert.deepEqual(postBody, expectedPostBody);
        });
    });
});
