import type { Todo } from './types'

const BASE_URL = import.meta.env.VITE_API_URL ?? ''

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

export const api = {
  getTodos: () => request<Todo[]>('/todos'),
  createTodo: (title: string) =>
    request<Todo>('/todos', { method: 'POST', body: JSON.stringify({ title }) }),
  updateTodo: (id: string, completed: boolean) =>
    request<Todo>(`/todos/${id}`, { method: 'PUT', body: JSON.stringify({ completed }) }),
  deleteTodo: (id: string) =>
    request<void>(`/todos/${id}`, { method: 'DELETE' }),
  getOrder: () => request<{ ids: string[] }>('/order'),
  updateOrder: (ids: string[]) =>
    request<{ ids: string[] }>('/order', { method: 'PUT', body: JSON.stringify({ ids }) }),
}
