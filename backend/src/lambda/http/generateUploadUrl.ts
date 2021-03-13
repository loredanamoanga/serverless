import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import { TodoAccess } from '../../dataLayer/todoAccess';
import {getUserId} from "../utils";
import * as AWS from 'aws-sdk';
const docClient = new AWS.DynamoDB.DocumentClient();
const todoItemTable = process.env.TODOS_TABLE;
const todoAccess = new TodoAccess(docClient, todoItemTable)
const bucketName = process.env.IMAGES_BUCKET
const urlExpiration = parseInt(process.env.SIGNED_URL_EXPIRATION)
import * as AWSXRay from 'aws-xray-sdk'
const XAWS = AWSXRay.captureAWS(AWS)


const s3 = new XAWS.S3({
  signatureVersion: 'v4'
})
export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId

  // TODO: Return a presigned URL to upload a file for a TODO item with the provided id - DONE
  const authHeader = event.headers['Authorization']
  // @ts-ignore
  const userId = getUserId(authHeader)

  if (!todoId) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        message:"invalid parameters"
      })
    }
  }
  const element = await todoAccess.getTodoById(todoId)
  if (element.Items[0].userId !== userId) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        message:"todo element belongs to another user"
      })
    }
  }
  try {
    const url = await getUploadUrl( bucketName, todoId,urlExpiration);
    await todoAccess.updateUploadedAttachment(bucketName, todoId);
    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        uploadUrl: url,
      })
    }
  } catch (e) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(e)
    }
  }
}


function getUploadUrl( bucketName:string, todoId: string, urlExpiration: number) {
  return s3.getSignedUrl('putObject', {
    Bucket: bucketName,
    Key: todoId,
    Expires: urlExpiration
  })
}