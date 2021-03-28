import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import {getUserId} from "../utils";
import {createLogger} from "../../utils/logger";
import {TodoAccess} from '../../dataLayer/todoAccess'
export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // TODO: Get all TODO items for a current user - DONE
    const logger = createLogger('getTodos')
    const userId = getUserId(event)

    try {
        const result = await new TodoAccess().getUserTodos(userId)
        if (result) {
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Credentials': true
                },
                body: JSON.stringify({
                    "items":result
                })
            }
        } else {
            logger.info('No todos for user ', userId)
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Credentials': true
                },
                body: null
            }
        }
    } catch (event) {
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true
            },
            body: JSON.stringify(event)
        }
    }
}
