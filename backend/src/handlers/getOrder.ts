import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { GetCommand } from '@aws-sdk/lib-dynamodb'
import { ddb, TABLE_NAME } from '../db'
import { USER_PK, ORDER_SK } from '../types'

export const handler: APIGatewayProxyHandlerV2 = async () => {
  const result = await ddb.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { PK: USER_PK, SK: ORDER_SK },
  }))

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids: result.Item?.ids ?? [] }),
  }
}
