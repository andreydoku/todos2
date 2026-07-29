import { useLayoutEffect, useRef } from 'react'
import type { ReactNode } from 'react'

interface Props {
  transitionKey: string
  children: ReactNode
}

const DURATION_MS = 200

// Cross-fades from the old content to the new one whenever `transitionKey`
// changes. The "old" side is a plain `cloneNode(true)` DOM snapshot, not a
// second React render of `children` — `children` contains live TodoList/
// TodoCard instances wired into the page's shared DndContext, and mounting a
// second copy of them would mean duplicate dnd-kit useDroppable/useSortable
// registrations under the same ids. A raw DOM clone has no hooks, so there's
// nothing to collide.
//
// A fade (not a slide) is deliberate: for a rolling window where most of the
// content is shared between the old and new view (e.g. 2 of 3 visible weeks
// unchanged after a 1-week step), a spatial slide shows that shared content
// at two different positions simultaneously while the blocks pass each
// other — inherent to the data overlap, not fixable by animating better. A
// fade never moves content, so that effect can't happen.
export function SlideSwitcher({ transitionKey, children }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const liveRef = useRef<HTMLDivElement>(null)
  const prevKeyRef = useRef(transitionKey)
  const snapshotRef = useRef<HTMLElement | null>(null)

  // Runs first each commit: if the key just changed, fade using whatever was
  // captured (below) at the end of the *previous* commit — i.e. the content
  // as it looked right before `children` updated to the new value.
  useLayoutEffect(() => {
    if (transitionKey === prevKeyRef.current) return
    prevKeyRef.current = transitionKey

    const container = containerRef.current
    const live = liveRef.current
    const clone = snapshotRef.current
    snapshotRef.current = null
    if (!container || !live || !clone) return

    clone.style.position = 'absolute'
    clone.style.inset = '0'
    clone.style.margin = '0'
    clone.style.transition = 'none'
    clone.style.opacity = '1'
    clone.style.pointerEvents = 'none'
    container.appendChild(clone)

    live.style.transition = 'none'
    live.style.opacity = '0'
    void live.offsetHeight // force a reflow so the starting opacity paints before animating

    const frame = requestAnimationFrame(() => {
      live.style.transition = `opacity ${DURATION_MS}ms ease-out`
      live.style.opacity = '1'
      clone.style.transition = `opacity ${DURATION_MS}ms ease-out`
      clone.style.opacity = '0'
    })

    const timeout = setTimeout(() => clone.remove(), DURATION_MS + 50)

    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timeout)
      clone.remove()
    }
  })

  // Runs second each commit: always re-snapshot the now-current content, so
  // whenever the key next changes there's something correct to freeze.
  useLayoutEffect(() => {
    snapshotRef.current = liveRef.current ? (liveRef.current.cloneNode(true) as HTMLElement) : null
  })

  return (
    <div ref={containerRef} className="relative h-full overflow-hidden">
      <div ref={liveRef} className="h-full">
        {children}
      </div>
    </div>
  )
}
