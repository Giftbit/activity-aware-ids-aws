import * as chai from "chai";
import {Message} from "./Message";

describe("Message", () => {
    describe("constructor()", () => {
        it("handles good input", () => {
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
                }
            };

            const message = new Message(pojo);

            chai.assert.deepEqual(JSON.parse(JSON.stringify(message)), pojo);
        });

        it("works if optional metadata fields are missing", () => {
            const pojo = {
                subject: "Some subject",
                fields: [
                    {
                        key: "aKey",
                        value: "SomeValue"
                    }
                ],
                metadata: {}
            };

            const message = new Message(pojo);

            chai.assert.deepEqual(JSON.parse(JSON.stringify(message)), pojo);
        });

        it("works if the metadata field is missing", () => {
            let pojo = {
                subject: "Some subject",
                fields: [
                    {
                        key: "aKey",
                        value: "SomeValue"
                    }
                ]
            };

            const message = new Message(pojo);

            // The message constructor will add the metadata object if it's missing
            pojo["metadata"] = {};

            chai.assert.deepEqual(JSON.parse(JSON.stringify(message)), pojo);
        });

        it("throws an error if the subject is missing", () => {
            let pojo = {
                fields: [
                    {
                        key: "aKey",
                        value: "SomeValue"
                    }
                ]
            };

            const instantiation = () => { new Message(pojo); };
            chai.expect(instantiation).to.throw(Error, "Missing Required Parameter 'subject'");
        });

        it("Throws an error if the fields is missing", () => {
            let pojo = {
                subject: "Some subject"
            };

            const instantation = () => { new Message(pojo); };
            chai.expect(instantation).to.throw(Error, "Missing Required Parameter 'fields'");
        });
    });
});
