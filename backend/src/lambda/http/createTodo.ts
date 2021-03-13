import 'source-map-support/register'

import {APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult} from 'aws-lambda'
import {getUserId} from "../utils";
import {TodoAccess} from '../../dataLayer/todoAccess'
import {CreateTodoRequest} from '../../requests/CreateTodoRequest'

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const newTodo: CreateTodoRequest = JSON.parse(event.body)

    const authHeader = event.headers['Authorization']
    // @ts-ignore
    const userId = getUserId(authHeader)
    const item = await new TodoAccess().createTodo(newTodo, userId)
    // TODO: Implement creating a new TODO item - DONE

    return {
        statusCode: 201,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify({
            "item": item
        })
    }
}
