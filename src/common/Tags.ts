import {Message} from "./Message";
import * as jmespath from 'jmespath'

export interface Tag {
    key: string;
    value: string;
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

export function resolveDynamicTagValues(tags: Tag[], data: any): Tag[] {
    const re = /\${([^}]+)}/g;

    return tags.map((tag: Tag) => {
        let value = tag.value;
        let match = null;
        do {
            match = re.exec(value);
            if (match) {
                const fullMatch = match[0];
                const searchString = match[1];

                value = value.replace(fullMatch, jmespath.search(data, searchString));
            }
        } while (match);

        return {
            key: tag.key,
            value: value
        };
    });
}


