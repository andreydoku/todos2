import { useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

interface Props {
  axis: 'x' | 'y'
  transitionKey: string
  direction: 1 | -1
  children: ReactNode
}

const DURATION_MS = 250

// Animates between two renders of `children` whenever `transitionKey` changes,
// sliding the previous content out while the new (live) content slides in.
// `children` itself is always rendered live (never frozen), so data updates
// that happen without a `transitionKey` change (e.g. a todo added mid-view)
// show up immediately — only the outgoing snapshot is ever frozen.
export function SlideSwitcher({ axis, transitionKey, direction, children }: Props) {
  const prevKeyRef = useRef(transitionKey)
  const prevChildrenRef = useRef(children)
  const [outgoing, setOutgoing] = useState<{ node: ReactNode; direction: 1 | -1 } | null>(null)
  const [animate, setAnimate] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  if (transitionKey !== prevKeyRef.current && (!outgoing || outgoing.node !== prevChildrenRef.current)) {
    setOutgoing({ node: prevChildrenRef.current, direction })
    setAnimate(false)
  }

  useLayoutEffect(() => {
    prevKeyRef.current = transitionKey
    prevChildrenRef.current = children
  })

  useLayoutEffect(() => {
    if (!outgoing || animate) return
    const frame = requestAnimationFrame(() => setAnimate(true))
    return () => cancelAnimationFrame(frame)
  }, [outgoing, animate])

  useLayoutEffect(() => {
    if (!outgoing || !animate) return
    timeoutRef.current = setTimeout(() => {
      setOutgoing(null)
      setAnimate(false)
    }, DURATION_MS)
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [outgoing, animate])

  function translate(percent: number) {
    return axis === 'x' ? `translateX(${percent}%)` : `translateY(${percent}%)`
  }

  return (
    <div className="relative h-full overflow-hidden">
      <div
        className="h-full"
        style={{
          transform: translate(!outgoing ? 0 : animate ? 0 : outgoing.direction * 100),
          transition: outgoing && animate ? `transform ${DURATION_MS}ms ease-out` : 'none',
        }}
      >
        {children}
      </div>
      {outgoing && (
        <div
          className="absolute inset-0"
          style={{
            transform: translate(animate ? -outgoing.direction * 100 : 0),
            transition: animate ? `transform ${DURATION_MS}ms ease-out` : 'none',
          }}
        >
          {outgoing.node}
        </div>
      )}
    </div>
  )
}
