import { GripVertical, Trash2 } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { TodoTitle } from './TodoTitle'
import { TodoDoDate } from './TodoDoDate'
import type { Todo } from '@/types'

interface Props {
  todo: Todo
  onToggle: (id: string, completed: boolean) => Promise<void>
  onRename: (id: string, title: string) => Promise<void>
  onSetDoDate: (id: string, doDate: string | null) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function TodoItem({ todo, onToggle, onRename, onSetDoDate, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: todo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.75 : 1,
  }

  return (
    <Card ref={setNodeRef} style={style} className="flex-row items-stretch gap-1 px-2 py-2 rounded-sm">
      <button
        className="flex cursor-grab items-center justify-center rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-slate-200 hover:text-foreground touch-none"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <GripVertical className="size-4" />
      </button>
      <label className="flex size-8 shrink-0 cursor-pointer items-center justify-center self-center rounded-sm transition-colors hover:bg-slate-200">
        <Checkbox
          checked={todo.completed}
          onCheckedChange={checked => onToggle(todo.id, checked === true)}
        />
      </label>
      <TodoTitle
        title={todo.title}
        completed={todo.completed}
        onSave={title => onRename(todo.id, title)}
      />
      <TodoDoDate
        doDate={todo.doDate}
        onSave={doDate => onSetDoDate(todo.id, doDate)}
      />
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => onDelete(todo.id)}
        className="rounded-sm cursor-pointer self-center text-muted-foreground hover:bg-slate-200 hover:text-destructive"
      >
        <Trash2 />
      </Button>
    </Card>
  )
}
