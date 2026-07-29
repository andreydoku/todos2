import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb'
import { ddb, TABLE_NAME } from '../db'
import { USER_PK, todoSK } from '../types'
import { isValidDoDate } from '../validation'

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const id = event.pathParameters?.id
  if (!id) return { statusCode: 400, body: JSON.stringify({ error: 'id is required' }) }

  const body = JSON.parse(event.body ?? '{}') as { title?: string; completed?: boolean; doDate?: string | null }

  const setUpdates: string[] = []
  const removeUpdates: string[] = []
  const values: Record<string, unknown> = {}

  if (body.title !== undefined) {
    if (!body.title.trim()) {
      return { statusCode: 400, body: JSON.stringify({ error: 'title cannot be empty' }) }
    }
    setUpdates.push('title = :title')
    values[':title'] = body.title.trim()
  }

  if (body.completed !== undefined) {
    if (typeof body.completed !== 'boolean') {
      return { statusCode: 400, body: JSON.stringify({ error: 'completed must be a boolean' }) }
    }
    setUpdates.push('completed = :completed')
    values[':completed'] = body.completed
  }

  if (body.doDate !== undefined) {
    if (body.doDate === null) {
      removeUpdates.push('doDate')
    } else if (!isValidDoDate(body.doDate)) {
      return { statusCode: 400, body: JSON.stringify({ error: 'doDate must be in YYYY-MM-DD format' }) }
    } else {
      setUpdates.push('doDate = :doDate')
      values[':doDate'] = body.doDate
    }
  }

  if (setUpdates.length === 0 && removeUpdates.length === 0) {
    return { statusCode: 400, body: JSON.stringify({ error: 'at least one of title, completed, or doDate is required' }) }
  }

  const expressionParts: string[] = []
  if (setUpdates.length) expressionParts.push(`SET ${setUpdates.join(', ')}`)
  if (removeUpdates.length) expressionParts.push(`REMOVE ${removeUpdates.join(', ')}`)

  let result
  try {
    result = await ddb.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: USER_PK, SK: todoSK(id) },
      UpdateExpression: expressionParts.join(' '),
      ...(setUpdates.length ? { ExpressionAttributeValues: values } : {}),
      ConditionExpression: 'attribute_exists(PK)',
      ReturnValues: 'ALL_NEW',
    }))
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      return { statusCode: 404, body: JSON.stringify({ error: 'todo not found' }) }
    }
    throw err
  }

  const { PK: _pk, SK: _sk, ...todo } = result.Attributes as Record<string, unknown> & { PK: string; SK: string }
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(todo),
  }
}
