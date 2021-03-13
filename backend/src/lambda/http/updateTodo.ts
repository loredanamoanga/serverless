import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'

import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import {getUserId} from "../utils";
import {TodoAccess} from '../../dataLayer/todoAccess'

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)

  // TODO: Update a TODO item with the provided id using values in the "updatedTodo" object
  const todoAccess = new TodoAccess()
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
    await todoAccess.updateTodo(updatedTodo, todoId);
    return {
      "statusCode": 204,
      "headers": {
        'Access-Control-Allow-Origin': '*',
      },
      "body": '',
    }

  } catch (e) {
    return {
      "statusCode": 500,
      "headers": {
        'Access-Control-Allow-Origin': '*',
      },
      "body": JSON.stringify({ e }),
    }
  }
}
