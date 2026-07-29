import { PointerSensor, pointerWithin, rectIntersection, useSensor, useSensors } from '@dnd-kit/core'
import type { CollisionDetection } from '@dnd-kit/core'
import type { Todo } from '@/types'

export interface TodoDragData {
  type: 'todo'
  listId: string
  todo: Todo
}

export interface ContainerDragData {
  type: 'container'
  listId: string
}

export function containerDroppableId(listId: string): string {
  return `container:${listId}`
}

// pointerWithin resolves ties by "which rect the cursor is literally inside,"
// which stays predictable across many small/adjacent containers (e.g. the
// month grid) where distance-based strategies like closestCenter can prefer a
// neighboring list over the one directly under the pointer.
export const collisionDetection: CollisionDetection = args => {
  const pointerCollisions = pointerWithin(args)
  return pointerCollisions.length > 0 ? pointerCollisions : rectIntersection(args)
}

export function useTodoDndSensors() {
  return useSensors(useSensor(PointerSensor))
}
