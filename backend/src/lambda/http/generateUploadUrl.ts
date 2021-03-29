import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import { TodoAccess } from '../../dataLayer/todoAccess';
import * as AWS from 'aws-sdk';
const docClient = new AWS.DynamoDB.DocumentClient();
const todoItemTable = process.env.TODOS_TABLE;
const todoAccess = new TodoAccess(docClient, todoItemTable)
const bucketName = process.env.IMAGES_BUCKET
const urlExpiration = parseInt(process.env.SIGNED_URL_EXPIRATION)
import * as AWSXRay from 'aws-xray-sdk'
import {getUserId} from "../utils";
const XAWS = AWSXRay.captureAWS(AWS)

const s3 = new XAWS.S3({
  signatureVersion: 'v4'
})

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  // TODO: Return a presigned URL to upload a file for a TODO item with the provided id - DONE
  const userId = getUserId(event)

  try {
    const url = await getUploadUrl(todoId);
    await todoAccess.updateAttachment(bucketName, todoId, userId);

    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        uploadUrl: url,
      })
    }
  } catch (e) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify(e)
    }
  }
}


function getUploadUrl( todoId: string) {
  return s3.getSignedUrl('putObject', {
    Bucket: bucketName,
    Key: todoId,
    Expires: urlExpiration
  })
}

