import * as jmespath from "./JMESPath";
import {Message} from "./Message";

export interface Tag {
    key: string;
    value: string;
}

export function applyTagsToMessage(tags: string, message: Message): Message {
    return null;
}

export function getTags(tagString: string, message: Message): Tag[] {
    return null;
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


