import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { api } from '@/api'
import type { Todo } from '@/types'

interface TodosContextValue {
  todos: Todo[]
  orderedIds: string[]
  loading: boolean
  error: string | null
  handleAdd: (title: string, doDate?: string | null) => Promise<void>
  handleToggle: (id: string, completed: boolean) => Promise<void>
  handleRename: (id: string, title: string) => Promise<void>
  handleSetDoDate: (id: string, doDate: string | null) => Promise<void>
  handleDelete: (id: string) => Promise<void>
  commitOrder: (newOrderedIds: string[]) => Promise<void>
  handleMoveTodo: (todoId: string, targetDate: string | null, newOrderedIds: string[]) => Promise<void>
}

const TodosContext = createContext<TodosContextValue | null>(null)

export function TodosProvider({ children }: { children: ReactNode }) {
  const [todos, setTodos] = useState<Todo[]>([])
  const [orderedIds, setOrderedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([api.getTodos(), api.getOrder()])
      .then(([fetchedTodos, { ids }]) => {
        setOrderedIds(ids)
        setTodos(fetchedTodos)
      })
      .catch(() => setError('Failed to load todos.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleAdd(title: string, doDate?: string | null) {
    const todo = await api.createTodo(title, doDate)
    const newIds = [...orderedIds, todo.id]
    setTodos(prev => [...prev, todo])
    setOrderedIds(newIds)
    await api.updateOrder(newIds)
  }

  async function handleToggle(id: string, completed: boolean) {
    const updated = await api.updateTodo(id, { completed })
    setTodos(prev => prev.map(t => (t.id === id ? updated : t)))
  }

  async function handleRename(id: string, title: string) {
    const updated = await api.updateTodo(id, { title })
    setTodos(prev => prev.map(t => (t.id === id ? updated : t)))
  }

  async function handleSetDoDate(id: string, doDate: string | null) {
    const updated = await api.updateTodo(id, { doDate })
    setTodos(prev => prev.map(t => (t.id === id ? updated : t)))
  }

  async function handleDelete(id: string) {
    await api.deleteTodo(id)
    const newIds = orderedIds.filter(oid => oid !== id)
    setTodos(prev => prev.filter(t => t.id !== id))
    setOrderedIds(newIds)
    await api.updateOrder(newIds)
  }

  async function commitOrder(newOrderedIds: string[]) {
    setOrderedIds(newOrderedIds)
    await api.updateOrder(newOrderedIds)
  }

  // Updates doDate and order together in one synchronous state update so a
  // cross-list drop never renders, even for one frame, in the wrong list
  // (todosForDate derives from both fields at once).
  async function handleMoveTodo(todoId: string, targetDate: string | null, newOrderedIds: string[]) {
    setTodos(prev => prev.map(t => (t.id === todoId ? { ...t, doDate: targetDate } : t)))
    setOrderedIds(newOrderedIds)
    await Promise.all([
      api.updateTodo(todoId, { doDate: targetDate }),
      api.updateOrder(newOrderedIds),
    ])
  }

  const value: TodosContextValue = {
    todos,
    orderedIds,
    loading,
    error,
    handleAdd,
    handleToggle,
    handleRename,
    handleSetDoDate,
    handleDelete,
    commitOrder,
    handleMoveTodo,
  }

  return <TodosContext.Provider value={value}>{children}</TodosContext.Provider>
}

export function useTodos(): TodosContextValue {
  const ctx = useContext(TodosContext)
  if (!ctx) throw new Error('useTodos must be used within a TodosProvider')
  return ctx
}
