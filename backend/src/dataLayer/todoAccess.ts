import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import {TodoItem} from "../models/TodoItem";
import {CreateTodoRequest} from "../requests/CreateTodoRequest";
import {DocumentClient} from 'aws-sdk/clients/dynamodb'



const XAWS = AWSXRay.captureAWS(AWS)
const uuid = require('uuid/v4')


export class TodoAccess {

    constructor(
        private readonly docClient: DocumentClient = createDynamoDBClient(),
        private readonly todoListTable = process.env.TODO_TABLE,
        private readonly userId = process.env.USER_ID_INDEX
    ) {
    }

    async createTodo(todoRequest: CreateTodoRequest, userId: string): Promise<TodoItem> {
        const generatedId = uuid()
        // @ts-ignore
        const element = new TodoItem();
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
    async getTodoById(todoId: string): Promise<AWS.DynamoDB.QueryOutput>{
        return await this.docClient.query({
            TableName: this.todoListTable,
            KeyConditionExpression: 'todoId = :todoId',
            ExpressionAttributeValues:{
                ':todoId': todoId
            }
        }).promise()
    }
    async deleteTodoById(todoId: string){
        const param = {
            TableName: this.todoListTable,
            Key:{
                "todoId":todoId
            }
        }

        await this.docClient.delete(param).promise()
    }
    async getUserTodos(userId: string): Promise<TodoItem[]>{
        const result = await this.docClient.query({
            TableName: this.todoListTable,
            IndexName: this.userId,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues:{
                ':userId':userId
            }
        }).promise()
        return result.Items as TodoItem[]
    }
    async updateUploadedAttachment(bucketName: string, todoId: string): Promise<void> {
        const params = {
            TableName: this.todoListTable,
            Key: {
                todoId,
            },
            UpdateExpression: "set attachmentUrl = :r",
            ExpressionAttributeValues: {
                ":r": `https://${bucketName}.s3.amazonaws.com/${todoId}`,
            },
            ReturnValues: "UPDATED_NEW"
        };

        await this.docClient.update(params).promise()
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