import * as chai from "chai";
import * as tagsLib from "./Tags";
import {MessageSender} from "./MessageSender";
import {Message} from "./Message";

describe("Tags", () => {
    describe("parseTags", () => {
        it("handles dense input", () => {
            const tagString = "key1:value1,key2:value2,key3:value3";
            const expected = [
               {
                   key: "key1",
                   value: "value1"
               },
               {
                   key: "key2",
                   value: "value2"
               },
               {
                   key: "key3",
                   value: "value3"
               }
            ];

            const tags = tagsLib.parseTags(tagString);
            chai.assert.sameDeepMembers(tags, expected);
        });

        it("handles extra spacing", () => {
            const tagString = " key1: value1, key2:  value2 , key3:value3   ";
            const expected = [
               {
                   key: "key1",
                   value: "value1"
               },
               {
                   key: "key2",
                   value: "value2"
               },
               {
                   key: "key3",
                   value: "value3"
               }
            ];

            const tags = tagsLib.parseTags(tagString);
            chai.assert.sameDeepMembers(tags, expected);
        });
    });

    describe("applyTagsToMessage", () => {
        it("handles happy path", () => {
            const tagString = "key1:value1,key2:value2";
            const message = new Message({
                subject: "A Subject",
                fields: []
            });

            const expected = new Message({
                subject: "A Subject",
                fields: [],
                tags: [
                    {
                        key: "key1",
                        value: "value1"
                    },
                    {
                        key: "key2",
                        value: "value2"
                    }
                ]
            });

            const result = tagsLib.applyTagsToMessage(tagString, message);
            chai.assert.deepEqual(result, expected);
        });
    });
});
