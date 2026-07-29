import { Navigate, useParams } from 'react-router-dom'
import { useTodos } from '@/context/TodosContext'
import { MultiListDndProvider } from '@/components/MultiListDndProvider'
import { TodoList } from '@/components/TodoList'
import { todosForDate } from '@/lib/todos'
import { formatDayLabel, isValidDateParam, todayISO } from '@/lib/date'

export function DayView() {
  const { date } = useParams<{ date: string }>()
  const { todos, orderedIds, handleAdd } = useTodos()

  if (!isValidDateParam(date)) {
    return <Navigate to={`/day/${todayISO()}`} replace />
  }

  const dayTodos = todosForDate(todos, orderedIds, date)
  const unscheduledTodos = todosForDate(todos, orderedIds, null)
  const listsById = { [date]: dayTodos, unscheduled: unscheduledTodos }

  return (
    <div className="grid h-full w-full grid-cols-1 gap-4 md:grid-cols-2">
      <MultiListDndProvider listsById={listsById}>
        {overListId => (
          <>
            <div className="h-full w-full max-w-[40rem] mx-auto">
              <TodoList
                listId={date}
                title={formatDayLabel(date)}
                todos={dayTodos}
                onAdd={title => handleAdd(title, date)}
                highlighted={overListId === date}
              />
            </div>
            <div className="h-full w-full max-w-[40rem] mx-auto">
              <TodoList
                listId="unscheduled"
                title="Unscheduled"
                todos={unscheduledTodos}
                onAdd={title => handleAdd(title)}
                highlighted={overListId === 'unscheduled'}
              />
            </div>
          </>
        )}
      </MultiListDndProvider>
    </div>
  )
}
