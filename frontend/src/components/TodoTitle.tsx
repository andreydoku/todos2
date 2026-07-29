import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  title: string
  completed: boolean
  compact?: boolean
  autoFocus?: boolean
  onAutoFocused?: () => void
  onSave: (title: string) => Promise<void>
}

export function TodoTitle({ title, completed, compact, autoFocus, onAutoFocused, onSave }: Props) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(title)
  const inputRef = useRef<HTMLInputElement>(null)

  function startEditing() {
    setValue(title)
    setEditing(true)
  }

  const onAutoFocusedRef = useRef(onAutoFocused)
  useEffect(() => {
    onAutoFocusedRef.current = onAutoFocused
  })

  // Newly-created todos start in edit mode so the placeholder title can be
  // typed over immediately; the input's own autoFocus + onFocus select() take
  // care of focusing and selecting once it mounts.
  useEffect(() => {
    if (autoFocus) {
      setValue(title)
      setEditing(true)
      onAutoFocusedRef.current?.()
    }
  }, [autoFocus, title])

  async function save() {
    const trimmed = value.trim()
    if (trimmed && trimmed !== title) {
      await onSave(trimmed)
    }
    setEditing(false)
  }

  function cancel() {
    setValue(title)
    setEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') save()
    if (e.key === 'Escape') cancel()
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        autoFocus
        value={value}
        onChange={e => setValue(e.target.value)}
        onFocus={e => e.target.select()}
        onBlur={save}
        onKeyDown={handleKeyDown}
        className={cn(
          'flex-1 bg-transparent border-b border-primary outline-none py-0.5',
          compact ? 'text-xs' : 'text-sm',
        )}
      />
    )
  }

  return (
    <span
      onClick={startEditing}
      className={cn(
        'flex flex-1 items-center cursor-pointer rounded-sm px-1 -mx-1 py-0.5 hover:bg-slate-200 transition-colors',
        compact ? 'text-xs' : 'text-sm',
        completed && 'line-through text-muted-foreground',
      )}
    >
      {title}
    </span>
  )
}
