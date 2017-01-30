import * as AWS from "aws-sdk";
import {Message} from "./Message";
import PublishInput = AWS.SNS.PublishInput;

export class MessageSender {
    sns: AWS.SNS;
    topicArn: string;

    constructor (topicArn: string) {
        this.sns = new AWS.SNS();
        this.topicArn = topicArn;
    }

    preparePublishInput(message: Message): PublishInput {
        return {
            Message: JSON.stringify(message),
            TopicArn: this.topicArn
        };
    }

    async send(message: Message): Promise<void> {
        console.log("Message.send invoked with:", message);

        const publishInput = this.preparePublishInput(message);

        try {
            await this.sns.publish(publishInput).promise();
        } catch (error) {
            console.error("An error occurred pushing message to topic", this.topicArn, message, error);
            throw error;
        }
    }
}
