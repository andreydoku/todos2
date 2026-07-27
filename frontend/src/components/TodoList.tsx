import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AddTodo } from './AddTodo'
import { TodoItem } from './TodoItem'
import { api } from '@/api'
import type { Todo } from '@/types'

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.getTodos()
      .then(data => setTodos(data.sort((a, b) => a.createdAt.localeCompare(b.createdAt))))
      .catch(() => setError('Failed to load todos.'))
  }, [])

  async function handleAdd(title: string) {
    const todo = await api.createTodo(title)
    setTodos(prev => [...prev, todo])
  }

  async function handleToggle(id: string, completed: boolean) {
    const updated = await api.updateTodo(id, completed)
    setTodos(prev => prev.map(t => t.id === id ? updated : t))
  }

  async function handleDelete(id: string) {
    await api.deleteTodo(id)
    setTodos(prev => prev.filter(t => t.id !== id))
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-10">
      <CardHeader>
        <CardTitle>My Todos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <AddTodo onAdd={handleAdd} />
        {error && <p className="text-sm text-destructive">{error}</p>}
        {todos.length === 0 && !error && (
          <p className="text-sm text-muted-foreground text-center py-4">No todos yet. Add one above!</p>
        )}
        <div className="divide-y">
          {todos.map(todo => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
