import "babel-polyfill";

import * as zlib from "zlib";

import * as awslambda from "aws-lambda";
import {MessageSender} from "../../common/MessageSender";
import {Message, Field} from "../../common/Message";
import {CloudWatchLogsEvent, CloudWatchLogsDecodedData, CloudTrailRecord} from "../../common/LambdaEvents";

const topicARN = process.env.SNS_TOPIC;
const messageSender = new MessageSender(topicARN);

const includedFields: FieldDescriptor[] = [
    {label: "Error Message", path: "errorMessage"},
    {label: "Event", path: "eventName"},
    {label: "Source", path: "eventSource"},
    {label: "Recipient Account ID", path: "recipientAccountId"},
    {label: "User Account ID", path: "userIdentity.accountId"},
    {label: "Username", path: "userIdentity.userName"},
    {label: "User ARN", path: "userIdentity.arn"},
    {label: "Source IP", path: "sourceIPAddress"},
    {label: "Request Parameters", path: "requestParameters"}
];

interface FieldDescriptor {
    label: string;
    path: string;
}

export const SOURCE_NAME = "Cloudtrail";
export const SOURCE_ICON_URL = "https://s3-us-west-2.amazonaws.com/giftbit-developer-static-resources/AWS-CloudTrail.png";

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

async function handlerAsync(event: CloudWatchLogsEvent): Promise<void> {
    const cloudwatchLogsDecoded = await unpackCloudWatchLogsDecodedData(event);

    for (let event of cloudwatchLogsDecoded.logEvents) {
        let cloudtrailLog: CloudTrailRecord = JSON.parse(event.message);
        let message = prepareMessageFromCloudTrailRecord(cloudtrailLog);

        if (message) {
            await messageSender.send(message);
        }
    }
}

export async function unpackCloudWatchLogsDecodedData(event: CloudWatchLogsEvent): Promise<CloudWatchLogsDecodedData> {
    const payload = new Buffer(event.awslogs.data, "base64");
    const unzipped = await new Promise<string>((resolve, reject)  => {
        zlib.gunzip(payload, (error, result) => {
            if (error) {
                console.error("An error occurred in unzipping the aws logs", error);
                reject(error);
            }

            resolve((result as Buffer).toString("utf8"));
        });
    });

    return (JSON.parse(unzipped) as CloudWatchLogsDecodedData);
}

export function prepareMessageFromCloudTrailRecord(cloudtrailLog: CloudTrailRecord): Message {
    let fields: Field[] = includedFields.map((fieldDescriptor: FieldDescriptor): Field => {
        const label = fieldDescriptor.label, path = fieldDescriptor.path;

        const value = getValueFromObjectPath(cloudtrailLog, path);
        if (value) {
            return {
                key: label,
                value: value
            };
        }
    }).filter(x => !!x);

    // If there's no relevant fields, there"s no way to make a subject, and no reason to send produce a message
    if (fields) {
        const subject = fields[0].key + ": " + fields[0].value;

        return messageFromSubjectAndFields(subject, fields);
    }

    return null;
}

export function messageFromSubjectAndFields(subject: string, fields: Field[]): Message {
    return new Message({
        subject: subject,
        fields: fields,
        metadata: {
            sourceName: SOURCE_NAME,
            sourceIconUrl: SOURCE_ICON_URL
        }
    });
}

export function getValueFromObjectPath(object: any, path: string): string {
    return path.split(".").reduce((object: any, path: string): string => object ? object[path] : null, object);
}
