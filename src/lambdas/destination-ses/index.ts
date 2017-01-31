import * as AWS from "aws-sdk"
import * as awslambda from "aws-lambda"
import {Message, Field} from "../../common/Message";
import {SNSEvent} from "../../common/LambdaEvents";
import {decodeMessageFromSNSEvent} from "../../common/MessageDecoder";

const ses = new AWS.SES();

const destinationEmails = process.env.EMAIL_DESTINATIONS;
const emailFrom = process.env.EMAIL_FROM;

const emails = destinationEmails.split(',')

export function handler(event: any, context: awslambda.Context, callback: awslambda.Callback): void {
    console.log("event", JSON.stringify(event, null, 2));
    handlerAsync(event)
        .then(res => {
            callback(undefined, res);
        }, err => {
            console.error(JSON.stringify(err, null, 2));
            callback(err);
        });
}

export async function handlerAsync(event: SNSEvent): Promise<string> {
    const message = decodeMessageFromSNSEvent(event);


    const emailOptions = prepareEmailOptions(message);
    await sendToSES(emailOptions);

    return "Payload sent";
}

export function prepareEmailOptions(message: Message): AWS.SES.Types.SendEmailRequest {
    const emailText = message.fields.map(field => field.key + ": " + field.value).join("\n");

    return {
        Destination: {
            ToAddresses: [
                emails
            ]
        },
        Message: {
            Body: {
                Text: {
                    Data: emailText,
                    Charset: 'utf8'
                }
            },
            Subject: {
                Data: message.subject,
                Charset: 'utf8'
            }
        },
        Source: emailFrom
    };
}

export async function sendToSES(emailOptions: AWS.SES.Types.SendEmailRequest) {
    await ses.sendEmail(emailOptions).promise()
}
