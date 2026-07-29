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
  formatMonthCellLabel,
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

  if (!isValidDateParam(date)) {
    return <Navigate to={`/month/${todayISO()}`} replace />
  }

  // Canonical, Monday-aligned anchor for the window — navigating always lands
  // on this, so the URL self-corrects even if it didn't start Monday-aligned.
  const anchor = startOfWeek(date)

  function go(delta: 1 | -1) {
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
    <MultiListDndProvider listsById={listsById} compact>
      {overListId => (
        <div className="flex h-full w-full items-stretch gap-4">
          <div className="flex h-full w-40 shrink-0 flex-col">
            <div className="mb-1 shrink-0 text-center text-xs font-medium text-neutral-400">{' '}</div>
            <div className="min-h-0 flex-1 overflow-hidden rounded-sm shadow-md">
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
          <div className="flex h-full min-w-0 flex-1 flex-col">
            <div className="mb-1 grid shrink-0 grid-cols-7 gap-1">
              {WEEKDAY_LABELS.map(label => (
                <div key={label} className="text-center text-xs font-medium text-neutral-400">
                  {label}
                </div>
              ))}
            </div>
            <div className="min-h-0 flex-1">
              <SlideSwitcher transitionKey={anchor}>
                <div className="grid h-full grid-cols-7 grid-rows-3 gap-1">
                  {dates.map(d => (
                    <div
                      key={d}
                      className={cn(
                        'h-full overflow-hidden rounded-sm border-2 shadow-md',
                        d === today ? 'border-slate-500' : 'border-transparent',
                      )}
                    >
                      <TodoList
                        listId={d}
                        title={formatMonthCellLabel(d)}
                        todos={listsById[d]}
                        onAdd={title => handleAdd(title, d)}
                        compact
                        highlighted={overListId === d}
                      />
                    </div>
                  ))}
                </div>
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
      )}
    </MultiListDndProvider>
  )
}
