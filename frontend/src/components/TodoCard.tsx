import { GripVertical, Trash2 } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { TodoTitle } from './TodoTitle'
import { TodoDoDate } from './TodoDoDate'
import { cn } from '@/lib/utils'
import type { TodoDragData } from '@/lib/dnd'
import type { Todo } from '@/types'

interface Props {
  todo: Todo
  listId: string
  compact?: boolean
  showDoDate?: boolean
  autoFocus?: boolean
  onAutoFocused?: () => void
  onToggle: (id: string, completed: boolean) => Promise<void>
  onRename: (id: string, title: string) => Promise<void>
  onSetDoDate: (id: string, doDate: string | null) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function TodoCard({
  todo,
  listId,
  compact,
  showDoDate,
  autoFocus,
  onAutoFocused,
  onToggle,
  onRename,
  onSetDoDate,
  onDelete,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: todo.id,
    data: { type: 'todo', listId, todo } satisfies TodoDragData,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      data-todo-id={todo.id}
      className={cn('flex-row items-stretch rounded-sm shadow-md', compact ? 'gap-0.5 px-1 py-0.5' : 'gap-1 px-2 py-2')}
    >
      <button
        className="flex cursor-grab items-center justify-center rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-slate-200 hover:text-foreground touch-none"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <GripVertical className={compact ? 'size-3' : 'size-4'} />
      </button>
      <label
        className={cn(
          'flex shrink-0 cursor-pointer items-center justify-center self-center rounded-sm transition-colors hover:bg-slate-200',
          compact ? 'size-6' : 'size-8',
        )}
      >
        <Checkbox
          checked={todo.completed}
          onCheckedChange={checked => onToggle(todo.id, checked === true)}
          className={compact ? 'size-3' : undefined}
        />
      </label>
      <TodoTitle
        title={todo.title}
        completed={todo.completed}
        compact={compact}
        autoFocus={autoFocus}
        onAutoFocused={onAutoFocused}
        onSave={title => onRename(todo.id, title)}
      />
      {showDoDate && (
        <TodoDoDate
          doDate={todo.doDate}
          compact={compact}
          onSave={doDate => onSetDoDate(todo.id, doDate)}
        />
      )}
      <Button
        variant="ghost"
        size={compact ? 'icon-xs' : 'icon-sm'}
        onClick={() => onDelete(todo.id)}
        className="rounded-sm cursor-pointer self-center text-muted-foreground hover:bg-slate-200 hover:text-destructive"
      >
        <Trash2 />
      </Button>
    </Card>
  )
}
