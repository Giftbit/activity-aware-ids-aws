import "babel-polyfill";

import * as url from "url";
import * as AWS from "aws-sdk";
import * as https from "https";
import * as awslambda from "aws-lambda";
import {Message, Field} from "../../common/Message";
import {SNSEvent} from "../../common/LambdaEvents";
import {Url} from "url";
import {decodeMessageFromSNSEvent} from "../../common/MessageDecoder";

const color = "danger";

const encryptedWebhookURL = process.env.SLACK_WEBHOOK_URL;
let decodedWebhookURL = null;

export function handler(event: any, context: awslambda.Context, callback: awslambda.Callback): void {
    console.log("event", JSON.stringify(event, null, 2));
    handlerAsync(event)
        .then(res => {
            callback(undefined, res);
        }, err => {
            console.error("An unhandled Error occurred while executing the handler",JSON.stringify(err, null, 2));
            callback(err);
        });
}

export async function handlerAsync(event: SNSEvent): Promise<string> {
    const message = decodeMessageFromSNSEvent(event);

    const webhookURL = await getWebhookURL();
    console.log("WebhookURL:", webhookURL);
    const body = preparePostBody(message);
    await sendToSlack(body, webhookURL);

    return "Payload sent";
}

export function preparePostBody(message: Message): any {
    console.log("preparePostBody, payload:", JSON.stringify(message));

    const slackText = message.fields.map(field => {
        let value = field.value;

        if (typeof value === "object") {
            value = JSON.stringify(value, null, 2);
        }

        return field.key + ": " + value;
    }
    ).join("\n");

    let slackBody = {
        username: message.metadata.sourceName,
        color: color,
        icon_url: message.metadata.sourceIconUrl,
        text: slackText
    };

    if (message.metadata) {
        if (message.metadata.sourceName) {
            slackBody.username = message.metadata.sourceName;
        }

        if (message.metadata.sourceIconUrl) {
            slackBody.icon_url = message.metadata.sourceIconUrl;
        }
    }

    return slackBody;
}

async function sendToSlack(body: any, webhookURL: Url): Promise<void> {
    console.log("postData:", body);

    const content = JSON.stringify(body);

    const postOptions = {
        host: webhookURL.host,
        path: webhookURL.path,
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(content)
        }
    };

    await new Promise((resolve, reject) => {
        let request = https.request(postOptions, (response) => {
            console.log(`response.statusCode ${response.statusCode}`);
            console.log(`response.headers ${JSON.stringify(response.headers)}`);
            resolve();
        });

        request.on("error", function (error) {
            console.log("sendResponse error", error);
            reject(error);
        });

        request.on("end", function () {
            console.log("end");
        });

        request.write(content);
        request.end();
    });
}

async function getWebhookURL(): Promise<Url> {
    if (decodedWebhookURL) {
        return decodedWebhookURL;
    } else {
        // Decrypt code should run once and variables stored outside of the function
        // handler so that these are decrypted once per container
        const kms = new AWS.KMS();
        const kmsResponse = await kms.decrypt({CiphertextBlob: new Buffer(encryptedWebhookURL, "base64")}).promise();

        const webhookPlaintext = (kmsResponse.Plaintext as Buffer).toString("ascii");
        const webhookURL = url.parse(webhookPlaintext);

        if (! (webhookURL && webhookURL.protocol &&  webhookURL.protocol.startsWith("https"))) {
            console.log("The Webhook URL didn't start with 'https'. This usually indicates an issue during decoding, or incorrect encryption");
            throw new Error("Error decoding Webhook URL: " + webhookURL.toString());
        }

        decodedWebhookURL = webhookURL;

        return decodedWebhookURL;
    }
}
