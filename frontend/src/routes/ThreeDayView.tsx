import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTodos } from '@/context/TodosContext'
import { MultiListDndProvider } from '@/components/MultiListDndProvider'
import { TodoList } from '@/components/TodoList'
import { SlideSwitcher } from '@/components/SlideSwitcher'
import { todosForDate } from '@/lib/todos'
import { addDays, consecutiveDates, formatDayLabel, isValidDateParam, todayISO } from '@/lib/date'
import type { Todo } from '@/types'

export function ThreeDayView() {
  const { date } = useParams<{ date: string }>()
  const { todos, orderedIds, handleAdd } = useTodos()
  const navigate = useNavigate()

  if (!isValidDateParam(date)) {
    return <Navigate to={`/3-day/${todayISO()}`} replace />
  }

  function go(delta: 1 | -1) {
    navigate(`/3-day/${addDays(date!, delta)}`)
  }

  const dates = consecutiveDates(date, 3)
  const unscheduledTodos = todosForDate(todos, orderedIds, null)
  const listsById: Record<string, Todo[]> = { unscheduled: unscheduledTodos }
  for (const d of dates) {
    listsById[d] = todosForDate(todos, orderedIds, d)
  }

  return (
    <MultiListDndProvider listsById={listsById}>
      {overListId => (
        <div className="flex h-full w-full items-stretch gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => go(-1)}
            aria-label="Previous day"
            className="cursor-pointer shrink-0 self-center text-neutral-300 hover:bg-slate-200 hover:text-black"
          >
            <ChevronLeft />
          </Button>
          <div className="h-full min-w-0 flex-1">
            <SlideSwitcher transitionKey={date}>
              <div className="grid h-full grid-cols-1 gap-4 sm:grid-cols-3">
                {dates.map(d => (
                  <TodoList
                    key={d}
                    listId={d}
                    title={formatDayLabel(d)}
                    todos={listsById[d]}
                    onAdd={title => handleAdd(title, d)}
                    highlighted={overListId === d}
                  />
                ))}
              </div>
            </SlideSwitcher>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => go(1)}
            aria-label="Next day"
            className="cursor-pointer shrink-0 self-center text-neutral-300 hover:bg-slate-200 hover:text-black"
          >
            <ChevronRight />
          </Button>
          <div className="h-full ml-4 w-64 shrink-0">
            <TodoList
              listId="unscheduled"
              title="Unscheduled"
              todos={unscheduledTodos}
              onAdd={title => handleAdd(title)}
              highlighted={overListId === 'unscheduled'}
            />
          </div>
        </div>
      )}
    </MultiListDndProvider>
  )
}
