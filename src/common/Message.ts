/**
 * A message that is passed from a Source to the Destinations
 */
export class Message {

    /**
     * A one liner of what event has occurred.
     *
     * This should be, if nothing else, what the user gets from what happened
     */
    subject: string;

    /**
     * A set of key/value pairs what will give additional detail about what has occurred
     */
    fields: Field[];

    /**
     * Additional metadata that can give additional context to the event, like a name for the source,
     * or an icon
     */
    metadata: {

        /**
         * The name of the source. Destinations may show this in the from field
         */
        sourceName?: string;

        /**
         * An icon to associate with the source. Destinations may show this in as an icon if available
         */
        sourceIconUrl?: string;
    };

    tags: Tag[];

    constructor (obj: any) {
        const requiredFields = [
            "subject",
            "fields"
        ];

        for (let field of requiredFields) {
            if (typeof obj[field] === "undefined") {
                throw new Error("Missing Required Parameter '" + field + "'");
            }
        }

        this.subject = obj.subject;
        this.fields = obj.fields;

        this.metadata = {};
        if (obj.metadata) {
            this.metadata.sourceName = obj.metadata.sourceName;
            this.metadata.sourceIconUrl = obj.metadata.sourceIconUrl;
        }

        this.tags = [];
        if (obj.tags) {
            obj.tags.forEach((tag) => {
                if (tag.key && tag.value) {
                    this.tags.push(tag);
                }
            });
        }
    }
}

export interface Field {
    key: string;
    value: string;
}

export interface Tag {
    key: string;
    value: string;
}
