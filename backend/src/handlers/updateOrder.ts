import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { PutCommand } from '@aws-sdk/lib-dynamodb'
import { ddb, TABLE_NAME } from '../db'
import { USER_PK, ORDER_SK } from '../types'

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const body = JSON.parse(event.body ?? '{}') as { ids?: unknown }
  if (!Array.isArray(body.ids) || !body.ids.every(id => typeof id === 'string')) {
    return { statusCode: 400, body: JSON.stringify({ error: 'ids must be an array of strings' }) }
  }

  const ids: string[] = body.ids
  await ddb.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: { PK: USER_PK, SK: ORDER_SK, ids },
  }))

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  }
}
