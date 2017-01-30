/**
 * See http://docs.aws.amazon.com/lambda/latest/dg/eventsources.html#eventsources-ses-email-receiving
 */
export interface SESEvent {
    Records: SESRecord[];
}

export interface SESRecord {
    eventVersion: string;
    ses: SESRecordSES;
    eventSource: string;
}

export interface SESRecordSES {
    mail: SESRecordMail;
    receipt: SESRecordReceipt;
}

export interface SESRecordMail {
    commonHeaders: SESRecordMailCommonHeaders;
    source: string;
    timestamp: string;
    destination: string[];
    headers: SESRecordMailHeader[];
    headersTruncated: boolean;
    messageId: string;
}

export interface SESRecordReceipt {
    recipients: string[];
    timestamp: string;
    spamVerdict: SESRecordReceiptVerdict;
    dkimVerdict: SESRecordReceiptVerdict;
    processingTimeMillis: number;
    action: SESRecordReceiptAction;
    spfVerdict: SESRecordReceiptVerdict;
    virusVerdict: SESRecordReceiptVerdict;
}

export interface SESRecordMailCommonHeaders {
    from: string[];
    to: string[];
    returnPath: string;
    messageId: string;
    date: string;
    subject: string;
}

export interface SESRecordMailHeader {
    name: string;
    value: string;
}

export interface SESRecordReceiptAction {
    type: string;
    invocationType: string;
    functionArn: string;
}

export interface SESRecordReceiptVerdict {
    status: string;
}

/**
 * See http://docs.aws.amazon.com/lambda/latest/dg/eventsources.html#eventsources-scheduled-event
 */
export interface ScheduledEvent {
    account: string;
    region: string;
    detail: any;
    "detail-type": string;
    source: string;
    time: string;
    id: string;
    resources: string[];
}

/**
 * See http://docs.aws.amazon.com/lambda/latest/dg/eventsources.html#eventsources-cloudwatch-logs
 */
export interface CloudWatchLogsEvent {
    awslogs: CloudWatchLogsEventData;
}

export interface CloudWatchLogsEventData {
    data: string;
}

export interface CloudWatchLogsDecodedData {
    owner: string;
    logGroup: string;
    logStream: string;
    subscriptionFilters: string[];
    messageType: string;
    logEvents: CloudWatchLogsLogEvent[];
}

/**
 * See http://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/SubscriptionFilters.html#LambdaFunctionExample
 */
export interface CloudWatchLogsLogEvent {
    id: string;
    timestamp: string;
    message: string;
}

/**
 * See http://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-log-file-examples.html#cloudtrail-log-file-examples-section
 */
export interface CloudTrailRecord {
    eventVersion: string;
    userIdentity: CloudTrailUserIdentity;
    eventTime: string;
    eventSource: string;
    eventName: string;
    awsRegion: string;
    sourceIPAddress: string;
    userAgent: string;
    errorCode?: string;
    errorMessage?: string;
    requestParameters: any;
    responseElements: any;
}

export interface CloudTrailUserIdentity {
    type: string;
    principalId: string;
    arn: string;
    accountId: string;
    accessKeyId: string;
    userName?: string;
    sessionContext?: any;
}

/**
 * See http://docs.aws.amazon.com/lambda/latest/dg/eventsources.html#eventsources-sns
 */
export interface SNSEvent {
    Records: SNSEventRecord[]
}

export interface SNSEventRecord {
    EventVersion: string;
    EventSubscriptionArn: string;
    EventSource: string;
    Sns: SNSEventRecordSNS;
}

export interface SNSEventRecordSNS {
    SignatureVersion: string;
    Timestamp: string;
    Signature: string;
    SigningCertUrl: string;
    MessageId: string;
    Message: string;
    MessageAttributes: any;
    Type: string;
    UnsubscribeUrl: string;
    TopicArn: string;
    Subject: string;
}

/**
 * See http://docs.aws.amazon.com/lambda/latest/dg/eventsources.html#eventsources-ddb-update
 */
export interface DynamoDBUpdateEvent {
    Records: DynamoDBUpdateRecord[];
}

export interface DynamoDBUpdateRecord {
    eventId: string;
    eventVersion: string;
    dynamodb: DynamoDBUpdateRecordStreamRecord;
    awsRegion: string;
    eventName: string;
    eventSourceARN: string;
    eventSource: string;
}

export interface DynamoDBUpdateRecordStreamRecord {
    Keys: any;
    NewImage?: any;
    OldImage?: any;
    StreamViewType: string;
    SequenceNumber: string;
    SizeBytes: number;
}

/**
 * See http://docs.aws.amazon.com/lambda/latest/dg/eventsources.html#eventsources-cognito-sync-trigger
 */
export interface CognitoSyncEvent {
    databaseName: string;
    eventType: string;
    region: string;
    identityId: string;
    datasetRecords: { [key: string]: CognitoSyncRecord }
    identityPoolId: string;
    version: number;
}

export interface CognitoSyncRecord {
    newValue: string;
    oldValue: string;
    op: string;
}

/**
 * See http://docs.aws.amazon.com/lambda/latest/dg/eventsources.html#eventsources-s3-put
 */
export interface S3Event {
    Records: S3Record
}

export interface S3Record {
    eventVersion: string;
    eventTime: string;
    requestParameters: any;
    s3: S3RecordS3Properties;
    responseElements: any;
    awsRegion: string;
    eventName: string;
    userIdentity: any;
    eventSource: string;
}

export interface S3RecordS3Properties {
    configurationId: string;
    object: S3RecordS3PropertiesObject;
    bucket: S3RecordS3PropertiesBucket;
    s3SchemaVersion: string;
}

export interface S3RecordS3PropertiesObject {
    eTag?: string;
    sequencer: string;
    key: string;
    size?: number;
}

export interface S3RecordS3PropertiesBucket {
    arn: string;
    name: string;
    ownerIdentity: any;
}

/**
 * See http://docs.aws.amazon.com/lambda/latest/dg/eventsources.html#eventsources-lex
 */
export interface LexEvent {
    messageVersion: string;
    invocationSource: string;
    userId: string;
    sessionAttributes: { [key: string]: string }
    bot: LexEventBot;
    outputDialogMode: string;
    currentIntent: LexEventIntent
}

export interface LexEventBot {
    name: string;
    alias: string;
    version: string;
}

export interface LexEventIntent {
    name: string;
    slots: { [key: string]: string }
    confirmationStatus: string;
}
