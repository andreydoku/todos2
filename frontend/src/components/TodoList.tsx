import { useEffect, useState } from 'react'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AddTodo } from './AddTodo'
import { TodoItem } from './TodoItem'
import { api } from '@/api'
import type { Todo } from '@/types'

function applyOrder(todos: Todo[], ids: string[]): Todo[] {
  const map = new Map(todos.map(t => [t.id, t]))
  const ordered = ids.filter(id => map.has(id)).map(id => map.get(id)!)
  const unordered = todos.filter(t => !ids.includes(t.id))
  return [...ordered, ...unordered]
}

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [orderedIds, setOrderedIds] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor))

  useEffect(() => {
    Promise.all([api.getTodos(), api.getOrder()])
      .then(([fetchedTodos, { ids }]) => {
        setOrderedIds(ids)
        setTodos(applyOrder(fetchedTodos, ids))
      })
      .catch(() => setError('Failed to load todos.'))
  }, [])

  async function handleAdd(title: string) {
    const todo = await api.createTodo(title)
    const newIds = [...orderedIds, todo.id]
    setTodos(prev => [...prev, todo])
    setOrderedIds(newIds)
    await api.updateOrder(newIds)
  }

  async function handleToggle(id: string, completed: boolean) {
    const updated = await api.updateTodo(id, { completed })
    setTodos(prev => prev.map(t => t.id === id ? updated : t))
  }

  async function handleRename(id: string, title: string) {
    const updated = await api.updateTodo(id, { title })
    setTodos(prev => prev.map(t => t.id === id ? updated : t))
  }

  async function handleDelete(id: string) {
    await api.deleteTodo(id)
    const newIds = orderedIds.filter(oid => oid !== id)
    setTodos(prev => prev.filter(t => t.id !== id))
    setOrderedIds(newIds)
    await api.updateOrder(newIds)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = todos.findIndex(t => t.id === active.id)
    const newIndex = todos.findIndex(t => t.id === over.id)
    const reordered = arrayMove(todos, oldIndex, newIndex)
    const newIds = reordered.map(t => t.id)

    setTodos(reordered)
    setOrderedIds(newIds)
    await api.updateOrder(newIds)
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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={todos.map(t => t.id)} strategy={verticalListSortingStrategy}>
            <div className="divide-y">
              {todos.map(todo => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={handleToggle}
                  onRename={handleRename}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  )
}
