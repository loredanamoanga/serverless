import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import {TodoItem} from "../models/TodoItem";
import {CreateTodoRequest} from "../requests/CreateTodoRequest";
import {DocumentClient} from 'aws-sdk/clients/dynamodb'
import { UpdateTodoRequest } from "../requests/UpdateTodoRequest";


const XAWS = AWSXRay.captureAWS(AWS)
const uuid = require('uuid/v4')


export class TodoAccess {

    constructor(
        private readonly docClient: DocumentClient = createDynamoDBClient(),
        private readonly todoListTable = process.env.TODO_TABLE,
        private readonly userId = process.env.USER_ID_INDEX
    ) {
    }
    async createTodo(request: CreateTodoRequest,userId: string): Promise<TodoItem>{
        const newId = uuid()
        const item = <any>{}
        item.userId= userId
        item.todoId= newId
        item.createdAt= new Date().toISOString()
        item.name= request.name
        item.dueDate= request.dueDate
        item.done= false

        await this.docClient.put({
            TableName: this.todoListTable,
            Item: item
        }).promise()

        return item
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
    async deleteTodoById(todoId: string, userId: string){
        const param = {
            TableName: this.todoListTable,
            Key:{
                userId: userId,
                todoId: todoId
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
    async updateAttachment(bucketName: string, todoId: string, userId: string): Promise<void> {
        const params = {
            TableName: this.todoListTable,
            Key: {
                todoId: todoId,
                userId: userId
            },
            UpdateExpression: "set attachmentUrl = :r",
            ExpressionAttributeValues: {
                ":r": `https://${bucketName}.s3.amazonaws.com/${todoId}`,
            },
            ReturnValues: "UPDATED_NEW"
        };
        await this.docClient.update(params).promise()
    }
    async updateTodo(updatedTodo:UpdateTodoRequest,todoId:string, userId: string){
        await this.docClient.update({
            TableName: this.todoListTable,
            Key:{
                userId: userId,
                todoId: todoId
            },
            UpdateExpression: 'set #namefield = :n, dueDate = :d, done = :done',
            ExpressionAttributeValues: {
                ':n' : updatedTodo.name,
                ':d' : updatedTodo.dueDate,
                ':done' : updatedTodo.done
            },
            ExpressionAttributeNames:{
                "#namefield": "name"
            }
        }).promise()
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