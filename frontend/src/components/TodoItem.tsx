import { GripVertical, Trash2 } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import type { Todo } from '@/types'

interface Props {
  todo: Todo
  onToggle: (id: string, completed: boolean) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function TodoItem({ todo, onToggle, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: todo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 py-2">
      <button
        className="cursor-grab text-muted-foreground hover:text-foreground touch-none"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <GripVertical className="size-4" />
      </button>
      <Checkbox
        checked={todo.completed}
        onCheckedChange={checked => onToggle(todo.id, checked === true)}
        id={`todo-${todo.id}`}
      />
      <label
        htmlFor={`todo-${todo.id}`}
        className={`flex-1 cursor-pointer text-sm ${todo.completed ? 'line-through text-muted-foreground' : ''}`}
      >
        {todo.title}
      </label>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => onDelete(todo.id)}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 />
      </Button>
    </div>
  )
}
