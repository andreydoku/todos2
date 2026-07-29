import { Calendar, GripVertical, Trash2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { formatDoDate } from './TodoDoDate'
import { cn } from '@/lib/utils'
import type { Todo } from '@/types'

interface Props {
  todo: Todo
  compact?: boolean
  showDoDate?: boolean
}

// Purely visual stand-in for TodoCard, used only inside DragOverlay. It can't
// be the real TodoCard: that calls useSortable(), and the original row (still
// mounted, mid-drag, in its source list) is already registered under the
// same todo id — a second live registration would be exactly the kind of
// duplicate-id bug that caused the calendar animation glitch. This has no
// dnd-kit hooks and no working handlers, just matching markup/classes.
export function TodoCardPreview({ todo, compact, showDoDate }: Props) {
  const dateLabel = !compact && todo.doDate ? formatDoDate(todo.doDate) : null

  return (
    <Card
      className={cn(
        'flex-row items-stretch rounded-sm shadow-lg',
        compact ? 'gap-0.5 px-1 py-0.5' : 'gap-1 px-2 py-2',
      )}
    >
      <div className="flex cursor-grabbing items-center justify-center rounded-sm p-0.5 text-muted-foreground">
        <GripVertical className={compact ? 'size-3' : 'size-4'} />
      </div>
      <div
        className={cn(
          'flex shrink-0 items-center justify-center self-center rounded-sm',
          compact ? 'size-6' : 'size-8',
        )}
      >
        <Checkbox checked={todo.completed} className={compact ? 'size-3' : undefined} />
      </div>
      <span
        className={cn(
          'flex flex-1 items-center rounded-sm px-1 -mx-1 py-0.5',
          compact ? 'text-xs' : 'text-sm',
          todo.completed && 'line-through text-muted-foreground',
        )}
      >
        {todo.title}
      </span>
      {showDoDate && (
        <span className="relative inline-block self-center">
          {dateLabel ? (
            <span className="flex w-14 h-8 flex-col items-center justify-center rounded-sm text-xs leading-none">
              <span>{dateLabel.monthDay}</span>
              {dateLabel.year && <span>{dateLabel.year}</span>}
            </span>
          ) : (
            <Button
              variant="ghost"
              size={compact ? 'icon-xs' : 'icon-sm'}
              tabIndex={-1}
              className={cn(
                'rounded-sm text-muted-foreground',
                !compact && 'w-14 h-8',
                compact && todo.doDate && 'text-foreground',
              )}
            >
              <Calendar />
            </Button>
          )}
        </span>
      )}
      <Button
        variant="ghost"
        size={compact ? 'icon-xs' : 'icon-sm'}
        tabIndex={-1}
        className="rounded-sm text-muted-foreground"
      >
        <Trash2 />
      </Button>
    </Card>
  )
}
