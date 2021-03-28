import 'source-map-support/register'

import {APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult} from 'aws-lambda'
import {getUserId} from "../utils";
import {TodoAccess} from '../../dataLayer/todoAccess'
import {CreateTodoRequest} from '../../requests/CreateTodoRequest'
import {createLogger} from "../../utils/logger";

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const newTodo: CreateTodoRequest = JSON.parse(event.body)
    const logger = createLogger('getTodos')

    // TODO: Implement creating a new TODO item - DONE
    const userId = getUserId(event)

    try {
        const item = await new TodoAccess().createTodo(newTodo, userId)
        return {
            "statusCode": 201,
            "headers": {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true
            },
            body: JSON.stringify({
                "item": item
            })
        }
    } catch (e) {
        logger.info('Todo creation failed ', event)
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
