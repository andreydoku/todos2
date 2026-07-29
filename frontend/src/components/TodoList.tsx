import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AddTodo } from './AddTodo'
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
  onAdd: (title: string) => Promise<void>
  compact?: boolean
  highlighted?: boolean
}

export function TodoList({ listId, title, todos, onAdd, compact, highlighted }: Props) {
  const { handleToggle, handleRename, handleSetDoDate, handleDelete } = useTodos()
  const { setNodeRef } = useDroppable({
    id: containerDroppableId(listId),
    data: { type: 'container', listId } satisfies ContainerDragData,
  })

  return (
    <Card
      className={cn(
        'h-full rounded-none border-none bg-transparent shadow-none transition-colors',
        compact ? 'gap-1 py-1' : 'gap-6 py-6',
        highlighted && 'bg-slate-600',
      )}
    >
      <CardHeader className={cn('shrink-0', compact ? 'px-1' : 'px-3')}>
        <CardTitle className={cn('text-neutral-100', compact && 'text-xs font-medium')}>{title}</CardTitle>
      </CardHeader>
      <CardContent
        className={cn('flex min-h-0 flex-1 flex-col', compact ? 'space-y-1 px-1' : 'space-y-4 px-3')}
      >
        <AddTodo onAdd={onAdd} compact={compact} />
        {todos.length === 0 && !compact && (
          <p className="text-sm text-neutral-400 text-center py-4">No todos yet. Add one above!</p>
        )}
        <SortableContext items={todos.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div
            ref={setNodeRef}
            className={cn('min-h-0 flex-1 overflow-y-auto', compact ? 'space-y-0.5' : 'space-y-2')}
          >
            {todos.map(todo => (
              <TodoCard
                key={todo.id}
                todo={todo}
                listId={listId}
                compact={compact}
                showDoDate={listId === 'all'}
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
