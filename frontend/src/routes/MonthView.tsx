import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTodos } from '@/context/TodosContext'
import { MultiListDndProvider } from '@/components/MultiListDndProvider'
import { TodoList } from '@/components/TodoList'
import { SlideSwitcher } from '@/components/SlideSwitcher'
import { todosForDate } from '@/lib/todos'
import {
  addDays,
  formatDayLabel,
  isValidDateParam,
  startOfWeek,
  threeWeekWindow,
  todayISO,
  WEEKDAY_LABELS,
} from '@/lib/date'
import { cn } from '@/lib/utils'
import type { Todo } from '@/types'

export function MonthView() {
  const { date } = useParams<{ date: string }>()
  const { todos, orderedIds, handleAdd } = useTodos()
  const navigate = useNavigate()
  const [direction, setDirection] = useState<1 | -1>(1)

  if (!isValidDateParam(date)) {
    return <Navigate to={`/month/${todayISO()}`} replace />
  }

  // Canonical, Monday-aligned anchor for the window — navigating always lands
  // on this, so the URL self-corrects even if it didn't start Monday-aligned.
  const anchor = startOfWeek(date)

  function go(delta: 1 | -1) {
    setDirection(delta)
    navigate(`/month/${addDays(anchor, delta * 7)}`)
  }

  const dates = threeWeekWindow(anchor)
  const today = todayISO()
  const unscheduledTodos = todosForDate(todos, orderedIds, null)
  const listsById: Record<string, Todo[]> = { unscheduled: unscheduledTodos }
  for (const d of dates) {
    listsById[d] = todosForDate(todos, orderedIds, d)
  }

  return (
    <div className="flex h-full w-full gap-2">
      <div className="flex h-full min-w-0 flex-1 flex-col">
        <div className="mb-1 grid shrink-0 grid-cols-7 gap-1">
          {WEEKDAY_LABELS.map(label => (
            <div key={label} className="text-center text-xs font-medium text-neutral-400">
              {label}
            </div>
          ))}
        </div>
        <div className="min-h-0 flex-1">
          <SlideSwitcher axis="y" transitionKey={anchor} direction={direction}>
            <MultiListDndProvider listsById={listsById} compact>
              {overListId => (
                <div className="flex h-full gap-4">
                  <div className="grid flex-1 grid-cols-7 gap-1">
                    {dates.map(d => (
                      <div
                        key={d}
                        className={cn('h-full rounded-sm', d === today && 'border-2 border-slate-500')}
                      >
                        <TodoList
                          listId={d}
                          title={formatDayLabel(d)}
                          todos={listsById[d]}
                          onAdd={title => handleAdd(title, d)}
                          compact
                          highlighted={overListId === d}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="h-full w-40 shrink-0">
                    <TodoList
                      listId="unscheduled"
                      title="Unscheduled"
                      todos={unscheduledTodos}
                      onAdd={title => handleAdd(title)}
                      compact
                      highlighted={overListId === 'unscheduled'}
                    />
                  </div>
                </div>
              )}
            </MultiListDndProvider>
          </SlideSwitcher>
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-1 pt-1">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => go(-1)}
          aria-label="Previous week"
          className="cursor-pointer text-neutral-300 hover:bg-slate-200 hover:text-black"
        >
          <ChevronUp />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => go(1)}
          aria-label="Next week"
          className="cursor-pointer text-neutral-300 hover:bg-slate-200 hover:text-black"
        >
          <ChevronDown />
        </Button>
      </div>
    </div>
  )
}
