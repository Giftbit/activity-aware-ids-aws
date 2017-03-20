import * as jmespath from "./JMESPath";
import {Message} from "./Message";

export interface Tag {
    key: string;
    value: string;
}

export function applyTagsToMessage(tagString: string, message: Message): Message {
    const tags = parseTags(tagString);
    message.tags = tags;

    return message;
}

export function parseTags(tagString: string): Tag[] {
    return tagString.split(",").map((pair) => {
        const pieces = pair.split(":");
        return {
            key: pieces[0].trim(),
            value: pieces[1].trim()
        };
    });
}


