interface JMESPath {
    search(input: any, query: String): any;
}

declare const JMESPath: JMESPath;
export = JMESPath;