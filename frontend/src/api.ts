import type { Todo } from './types'

const BASE_URL = import.meta.env.VITE_API_URL ?? ''

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })

  // Some responses (e.g. DELETE's 204) have no body — res.json() throws on
  // empty input, so parse manually and tolerate an empty/non-JSON body.
  const text = await res.text()
  let data: unknown
  try {
    data = text ? JSON.parse(text) : undefined
  } catch {
    data = undefined
  }

  if (!res.ok) {
    const message =
      data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
        ? data.error
        : `${res.status} ${res.statusText}`
    throw new Error(message)
  }

  return data as T
}

export const api = {
  getTodos: () => request<Todo[]>('/todos'),
  createTodo: (id: string, title: string, doDate?: string | null) =>
    request<Todo>('/todos', { method: 'POST', body: JSON.stringify({ id, title, doDate }) }),
  updateTodo: (id: string, updates: { title?: string; completed?: boolean; doDate?: string | null }) =>
    request<Todo>(`/todos/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  deleteTodo: (id: string) =>
    request<void>(`/todos/${id}`, { method: 'DELETE' }),
  getOrder: () => request<{ ids: string[] }>('/order'),
  updateOrder: (ids: string[]) =>
    request<{ ids: string[] }>('/order', { method: 'PUT', body: JSON.stringify({ ids }) }),
}
