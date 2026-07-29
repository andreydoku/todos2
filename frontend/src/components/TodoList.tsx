import { useRef, useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TodoCard } from './TodoCard'
import { useTodos } from '@/context/TodosContext'
import { containerDroppableId } from '@/lib/dnd'
import { cn } from '@/lib/utils'
import type { ContainerDragData } from '@/lib/dnd'
import type { Todo } from '@/types'

interface Props {
  listId: string
  title: string
  todos: Todo[]
  onAdd: (title: string) => Promise<Todo>
  compact?: boolean
  highlighted?: boolean
}

export function TodoList({ listId, title, todos, onAdd, compact, highlighted }: Props) {
  const { handleToggle, handleRename, handleSetDoDate, handleDelete } = useTodos()
  const { setNodeRef } = useDroppable({
    id: containerDroppableId(listId),
    data: { type: 'container', listId } satisfies ContainerDragData,
  })
  const itemsRef = useRef<HTMLDivElement | null>(null)
  const [justAddedId, setJustAddedId] = useState<string | null>(null)

  function setItemsRef(node: HTMLDivElement | null) {
    itemsRef.current = node
    setNodeRef(node)
  }

  async function handleAddClick() {
    let todo: Todo
    try {
      todo = await onAdd('new task')
    } catch {
      return
    }
    setJustAddedId(todo.id)
    requestAnimationFrame(() => {
      itemsRef.current?.querySelector(`[data-todo-id="${todo.id}"]`)?.scrollIntoView({ block: 'nearest' })
    })
  }

  return (
    <Card
      className={cn(
        'h-full rounded-none border-none bg-transparent shadow-none transition-colors',
        compact ? 'gap-1 py-1' : 'gap-6 py-6',
        highlighted && 'bg-slate-600',
      )}
    >
      <div className={cn('flex shrink-0 items-center justify-between', compact ? 'px-1' : 'px-3')}>
        <CardTitle className={cn('text-neutral-100', compact && 'text-xs font-medium')}>{title}</CardTitle>
        <Button
          variant="ghost"
          size={compact ? 'icon-xs' : 'icon-sm'}
          onClick={handleAddClick}
          aria-label="Add todo"
          className="cursor-pointer rounded-sm text-muted-foreground hover:bg-slate-200 hover:text-foreground"
        >
          <Plus />
        </Button>
      </div>
      <CardContent
        className={cn('flex min-h-0 flex-1 flex-col', compact ? 'space-y-1 px-1' : 'space-y-4 px-3')}
      >
        {todos.length === 0 && !compact && (
          <p className="text-sm text-neutral-400 text-center py-4">No todos yet. Add one above!</p>
        )}
        <SortableContext items={todos.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div ref={setItemsRef} className={cn('min-h-0 flex-1 overflow-y-auto', compact ? 'space-y-0.5' : 'space-y-2')}>
            {todos.map(todo => (
              <TodoCard
                key={todo.id}
                todo={todo}
                listId={listId}
                compact={compact}
                showDoDate={listId === 'all'}
                autoFocus={todo.id === justAddedId}
                onAutoFocused={() => setJustAddedId(null)}
                onToggle={handleToggle}
                onRename={handleRename}
                onSetDoDate={handleSetDoDate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </SortableContext>
      </CardContent>
    </Card>
  )
}
