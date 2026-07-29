import { useTodos } from '@/context/TodosContext'
import { MultiListDndProvider } from '@/components/MultiListDndProvider'
import { TodoList } from '@/components/TodoList'
import { orderAll } from '@/lib/todos'

export function AllView() {
  const { todos, orderedIds, handleAdd } = useTodos()
  const ordered = orderAll(todos, orderedIds)

  return (
    <div className="h-full w-full max-w-[40rem] mx-auto">
      <MultiListDndProvider listsById={{ all: ordered }}>
        {overListId => (
          <TodoList
            listId="all"
            title="My Todos"
            todos={ordered}
            onAdd={title => handleAdd(title)}
            highlighted={overListId === 'all'}
          />
        )}
      </MultiListDndProvider>
    </div>
  )
}
