import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'

import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import {getUserId} from "../utils";
import {TodoAccess} from '../../dataLayer/todoAccess'
import {createLogger} from "../../utils/logger";

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)
  const logger = createLogger('getTodos')
  // TODO: Update a TODO item with the provided id using values in the "updatedTodo" object - DONE
  const todoAccess = new TodoAccess()
  const userId = getUserId(event)
  logger.info(`update for user ${userId}`)

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
        'Access-Control-Allow-Credentials': true
      },
      "body": '',
    }

  } catch (event) {
    return {
      "statusCode": 500,
      "headers": {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      "body": JSON.stringify({ event }),
    }
  }
}
