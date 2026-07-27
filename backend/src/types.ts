export interface Todo {
  id: string
  title: string
  completed: boolean
  createdAt: string
}

export interface DynamoTodo extends Todo {
  PK: string
  SK: string
}

export const USER_PK = 'USER#default'
export const todoSK = (id: string) => `TODO#${id}`
export const ORDER_SK = 'ORDER'
