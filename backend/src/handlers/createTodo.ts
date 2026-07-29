import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { PutCommand } from '@aws-sdk/lib-dynamodb'
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb'
import { ddb, TABLE_NAME } from '../db'
import { USER_PK, todoSK } from '../types'
import type { DynamoTodo } from '../types'
import { isValidDoDate } from '../validation'

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const body = JSON.parse(event.body ?? '{}') as { id?: string; title?: string; doDate?: string | null }
  if (!body.id?.trim()) {
    return { statusCode: 400, body: JSON.stringify({ error: 'id is required' }) }
  }
  if (!body.title?.trim()) {
    return { statusCode: 400, body: JSON.stringify({ error: 'title is required' }) }
  }
  if (body.doDate != null && !isValidDoDate(body.doDate)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'doDate must be in YYYY-MM-DD format' }) }
  }

  const id = body.id
  const item: DynamoTodo = {
    PK: USER_PK,
    SK: todoSK(id),
    id,
    title: body.title.trim(),
    completed: false,
    createdAt: new Date().toISOString(),
    ...(body.doDate != null ? { doDate: body.doDate } : {}),
  }

  try {
    await ddb.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
      ConditionExpression: 'attribute_not_exists(PK)',
    }))
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      return { statusCode: 409, body: JSON.stringify({ error: 'id already exists' }) }
    }
    throw err
  }

  const { PK: _pk, SK: _sk, ...todo } = item
  return {
    statusCode: 201,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(todo),
  }
}
