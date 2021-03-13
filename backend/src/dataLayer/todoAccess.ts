import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import {TodoItem} from "../models/TodoItem";
import {CreateTodoRequest} from "../requests/CreateTodoRequest";
import {DocumentClient} from 'aws-sdk/clients/dynamodb'

const XAWS = AWSXRay.captureAWS(AWS)
const uuid = require('uuid/v4')


export class GroupAccess {

    constructor(
        private readonly docClient: DocumentClient = createDynamoDBClient(),
        private readonly todoListTable = process.env.TODO_TABLE,
        private readonly userIdIndex = process.env.USER_ID_INDEX
    ) {
    }

    async createTodo(todoRequest: CreateTodoRequest, userId: string): Promise<TodoItem> {
        const generatedId = uuid()
        const element = new TodoItem()
        element.userId = userId
        element.todoId = generatedId
        element.createdAt = new Date().toISOString()
        element.name = todoRequest.name
        element.dueDate = todoRequest.dueDate
        element.done = false
        await this.docClient.put({
            TableName: this.todoListTable,
            Item: element
        }).promise()

        return element
    }
}

function createDynamoDBClient() {
    if (process.env.IS_OFFLINE) {
        console.log('Creating a local DynamoDB instance')
        return new XAWS.DynamoDB.DocumentClient({
            region: 'localhost',
            endpoint: 'http://localhost:8000'
        })
    }

    return new XAWS.DynamoDB.DocumentClient()
}