import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import { ddb, TABLE_NAME } from '../db'
import { USER_PK } from '../types'

export const handler: APIGatewayProxyHandlerV2 = async () => {
  const result = await ddb.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
    ExpressionAttributeValues: { ':pk': USER_PK, ':prefix': 'TODO#' },
  }))

  const todos = (result.Items ?? []).map(({ PK: _pk, SK: _sk, ...todo }) => todo)

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(todos),
  }
}
