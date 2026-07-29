import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { api } from '@/api'
import type { Todo } from '@/types'

interface TodosContextValue {
  todos: Todo[]
  orderedIds: string[]
  loading: boolean
  error: string | null
  handleAdd: (title: string, doDate?: string | null) => Promise<Todo>
  handleToggle: (id: string, completed: boolean) => Promise<void>
  handleRename: (id: string, title: string) => Promise<void>
  handleSetDoDate: (id: string, doDate: string | null) => Promise<void>
  handleDelete: (id: string) => Promise<void>
  commitOrder: (newOrderedIds: string[]) => Promise<void>
  handleMoveTodo: (todoId: string, targetDate: string | null, newOrderedIds: string[]) => Promise<void>
}

const TodosContext = createContext<TodosContextValue | null>(null)

function messageFor(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback
}

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

  // The id is generated client-side (crypto.randomUUID()) specifically so the
  // optimistic todo can be added under its FINAL id — no later id swap means
  // no React remount, which would otherwise blow away the auto-focused edit
  // state TodoList sets up right after this resolves.
  async function handleAdd(title: string, doDate?: string | null): Promise<Todo> {
    setError(null)
    const id = crypto.randomUUID()
    const optimisticTodo: Todo = {
      id,
      title,
      completed: false,
      createdAt: new Date().toISOString(),
      ...(doDate !== undefined ? { doDate } : {}),
    }
    const newIds = [...orderedIds, id]
    setTodos(prev => [...prev, optimisticTodo])
    setOrderedIds(newIds)
    try {
      const todo = await api.createTodo(id, title, doDate)
      setTodos(prev => prev.map(t => (t.id === id ? todo : t)))
      try {
        await api.updateOrder(newIds)
      } catch (err) {
        setError(messageFor(err, 'Todo added, but failed to save its position.'))
      }
      return todo
    } catch (err) {
      setTodos(prev => prev.filter(t => t.id !== id))
      setOrderedIds(prev => prev.filter(oid => oid !== id))
      setError(messageFor(err, 'Failed to add todo.'))
      throw err
    }
  }

  async function handleToggle(id: string, completed: boolean) {
    setError(null)
    const previousTodos = todos
    setTodos(prev => prev.map(t => (t.id === id ? { ...t, completed } : t)))
    try {
      await api.updateTodo(id, { completed })
    } catch (err) {
      setTodos(previousTodos)
      setError(messageFor(err, 'Failed to update todo.'))
    }
  }

  async function handleRename(id: string, title: string) {
    setError(null)
    const previousTodos = todos
    setTodos(prev => prev.map(t => (t.id === id ? { ...t, title } : t)))
    try {
      await api.updateTodo(id, { title })
    } catch (err) {
      setTodos(previousTodos)
      setError(messageFor(err, 'Failed to rename todo.'))
    }
  }

  async function handleSetDoDate(id: string, doDate: string | null) {
    setError(null)
    const previousTodos = todos
    setTodos(prev => prev.map(t => (t.id === id ? { ...t, doDate } : t)))
    try {
      await api.updateTodo(id, { doDate })
    } catch (err) {
      setTodos(previousTodos)
      setError(messageFor(err, 'Failed to update date.'))
    }
  }

  async function handleDelete(id: string) {
    setError(null)
    const previousTodos = todos
    const previousOrderedIds = orderedIds
    const newIds = orderedIds.filter(oid => oid !== id)
    setTodos(prev => prev.filter(t => t.id !== id))
    setOrderedIds(newIds)
    try {
      await api.deleteTodo(id)
      await api.updateOrder(newIds)
    } catch (err) {
      setTodos(previousTodos)
      setOrderedIds(previousOrderedIds)
      setError(messageFor(err, 'Failed to delete todo.'))
    }
  }

  async function commitOrder(newOrderedIds: string[]) {
    setError(null)
    const previousOrderedIds = orderedIds
    setOrderedIds(newOrderedIds)
    try {
      await api.updateOrder(newOrderedIds)
    } catch (err) {
      setOrderedIds(previousOrderedIds)
      setError(messageFor(err, 'Failed to save the new order.'))
    }
  }

  // Updates doDate and order together in one synchronous state update so a
  // cross-list drop never renders, even for one frame, in the wrong list
  // (todosForDate derives from both fields at once).
  async function handleMoveTodo(todoId: string, targetDate: string | null, newOrderedIds: string[]) {
    setError(null)
    const previousTodos = todos
    const previousOrderedIds = orderedIds
    setTodos(prev => prev.map(t => (t.id === todoId ? { ...t, doDate: targetDate } : t)))
    setOrderedIds(newOrderedIds)
    try {
      await Promise.all([
        api.updateTodo(todoId, { doDate: targetDate }),
        api.updateOrder(newOrderedIds),
      ])
    } catch (err) {
      setTodos(previousTodos)
      setOrderedIds(previousOrderedIds)
      setError(messageFor(err, 'Failed to move todo.'))
    }
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
