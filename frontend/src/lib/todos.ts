import type { Todo } from '@/types'

export function orderAll(todos: Todo[], orderedIds: string[]): Todo[] {
  const map = new Map(todos.map(t => [t.id, t]))
  const ordered = orderedIds.filter(id => map.has(id)).map(id => map.get(id)!)
  const unordered = todos.filter(t => !orderedIds.includes(t.id))
  return [...ordered, ...unordered]
}

export function todosForDate(todos: Todo[], orderedIds: string[], date: string | null): Todo[] {
  const matching = todos.filter(t => (t.doDate ?? null) === date)
  return orderAll(matching, orderedIds)
}

// Reshuffles only the ids in `visibleIds`, leaving every other id's absolute
// slot in `fullIds` untouched. `newSubsetOrder` ids missing from `fullIds`
// (e.g. a just-created todo whose order hasn't round-tripped yet) are appended.
export function reorderSubset(fullIds: string[], visibleIds: string[], newSubsetOrder: string[]): string[] {
  const visibleSet = new Set(visibleIds)
  let i = 0
  const result = fullIds.map(id => (visibleSet.has(id) ? newSubsetOrder[i++] : id))
  while (i < newSubsetOrder.length) {
    result.push(newSubsetOrder[i++])
  }
  return result
}

// Moves `todoId` out of its current position in `fullOrderedIds` and re-splices
// it at `insertIndex` within the target list's currently-visible run, anchoring
// against whichever visible id currently occupies that slot.
export function moveBetweenLists(
  fullOrderedIds: string[],
  todoId: string,
  targetListVisibleIds: string[],
  insertIndex: number,
): string[] {
  const withoutMoved = fullOrderedIds.filter(id => id !== todoId)
  const clamped = Math.max(0, Math.min(insertIndex, targetListVisibleIds.length))
  const anchorId = targetListVisibleIds[clamped]
  const anchorIdx = anchorId !== undefined ? withoutMoved.indexOf(anchorId) : -1

  if (anchorIdx !== -1) {
    return [...withoutMoved.slice(0, anchorIdx), todoId, ...withoutMoved.slice(anchorIdx)]
  }

  if (targetListVisibleIds.length === 0) {
    return [...withoutMoved, todoId]
  }

  const lastVisibleId = targetListVisibleIds[targetListVisibleIds.length - 1]
  const lastIdx = withoutMoved.indexOf(lastVisibleId)
  if (lastIdx === -1) {
    return [...withoutMoved, todoId]
  }
  return [...withoutMoved.slice(0, lastIdx + 1), todoId, ...withoutMoved.slice(lastIdx + 1)]
}
