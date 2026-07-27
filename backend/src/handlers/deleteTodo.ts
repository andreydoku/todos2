import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DeleteCommand } from '@aws-sdk/lib-dynamodb'
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb'
import { ddb, TABLE_NAME } from '../db'
import { USER_PK, todoSK } from '../types'

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const id = event.pathParameters?.id
  if (!id) return { statusCode: 400, body: JSON.stringify({ error: 'id is required' }) }

  try {
    await ddb.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { PK: USER_PK, SK: todoSK(id) },
      ConditionExpression: 'attribute_exists(PK)',
    }))
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      return { statusCode: 404, body: JSON.stringify({ error: 'todo not found' }) }
    }
    throw err
  }

  return { statusCode: 204, body: '' }
}
