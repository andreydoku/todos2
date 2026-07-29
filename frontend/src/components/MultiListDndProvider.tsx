import { useState } from 'react'
import type { ReactNode } from 'react'
import { DndContext, DragOverlay, MeasuringStrategy } from '@dnd-kit/core'
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { Card } from '@/components/ui/card'
import { collisionDetection, useTodoDndSensors } from '@/lib/dnd'
import type { ContainerDragData, TodoDragData } from '@/lib/dnd'
import { moveBetweenLists, reorderSubset } from '@/lib/todos'
import { useTodos } from '@/context/TodosContext'
import { cn } from '@/lib/utils'
import type { Todo } from '@/types'

interface Props {
  listsById: Record<string, Todo[]>
  compact?: boolean
  children: (overListId: string | null) => ReactNode
}

interface DropTarget {
  listId: string
  todoId: string | null
}

function resolveDrop(over: DragEndEvent['over']): DropTarget | null {
  if (!over) return null
  const data = over.data.current as TodoDragData | ContainerDragData | undefined
  if (!data) return null
  if (data.type === 'todo') return { listId: data.listId, todoId: over.id as string }
  if (data.type === 'container') return { listId: data.listId, todoId: null }
  return null
}

// Every list on a multi-list page needs to share one drag session so a todo
// can be dropped into a DIFFERENT list, not just reordered within its own.
export function MultiListDndProvider({ listsById, compact, children }: Props) {
  const { orderedIds, commitOrder, handleMoveTodo } = useTodos()
  const sensors = useTodoDndSensors()
  const [activeTodo, setActiveTodo] = useState<Todo | null>(null)
  const [overListId, setOverListId] = useState<string | null>(null)

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as TodoDragData | undefined
    setActiveTodo(data?.type === 'todo' ? data.todo : null)
  }

  function handleDragOver(event: DragOverEvent) {
    setOverListId(resolveDrop(event.over)?.listId ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTodo(null)
    setOverListId(null)

    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeData = active.data.current as TodoDragData | undefined
    if (activeData?.type !== 'todo') return

    const drop = resolveDrop(over)
    if (!drop) return

    const sourceListId = activeData.listId
    const activeId = active.id as string
    const sourceVisibleIds = (listsById[sourceListId] ?? []).map(t => t.id)
    const targetVisibleIds = (listsById[drop.listId] ?? []).map(t => t.id)

    let insertIndex: number
    if (drop.todoId === null) {
      insertIndex = targetVisibleIds.length
    } else {
      const overIndex = targetVisibleIds.indexOf(drop.todoId)
      const activeRect = active.rect.current.translated
      const isBelowOverItem = !!activeRect && activeRect.top > over.rect.top + over.rect.height / 2
      insertIndex = overIndex + (isBelowOverItem ? 1 : 0)
    }

    if (sourceListId === drop.listId) {
      const oldIndex = sourceVisibleIds.indexOf(activeId)
      let newIndex = insertIndex
      if (oldIndex < newIndex) newIndex -= 1
      if (oldIndex === newIndex) return
      const newSubsetOrder = arrayMove(sourceVisibleIds, oldIndex, newIndex)
      commitOrder(reorderSubset(orderedIds, sourceVisibleIds, newSubsetOrder))
      return
    }

    const targetDate = drop.listId === 'unscheduled' ? null : drop.listId
    const newOrderedIds = moveBetweenLists(orderedIds, activeId, targetVisibleIds, insertIndex)
    handleMoveTodo(activeId, targetDate, newOrderedIds)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      measuring={compact ? { droppable: { strategy: MeasuringStrategy.Always } } : undefined}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {children(overListId)}
      <DragOverlay>
        {activeTodo && (
          <Card
            className={cn(
              'flex-row items-center rounded-sm shadow-lg',
              compact ? 'gap-0.5 px-1 py-0.5 text-xs' : 'gap-1 px-2 py-2 text-sm',
            )}
          >
            <span className={cn('truncate', activeTodo.completed && 'line-through text-muted-foreground')}>
              {activeTodo.title}
            </span>
          </Card>
        )}
      </DragOverlay>
    </DndContext>
  )
}
