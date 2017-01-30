import {SNSEvent} from "./LambdaEvents";
import {Message} from "./Message";

export function decodeMessageFromSNSEvent(event: SNSEvent): Message {
    try {
        const message = event.Records[0].Sns.Message;

        return new Message(JSON.parse(message));
    }
    catch (err) {
        console.error("An error was encountered parsing the incoming json, Error was:", err);
        throw err;
    }
}