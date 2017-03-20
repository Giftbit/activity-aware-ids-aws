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
});
