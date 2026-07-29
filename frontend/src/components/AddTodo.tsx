import { useEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface Props {
  onAdd: (title: string) => Promise<void>
  compact?: boolean
}

export function AddTodo({ onAdd, compact }: Props) {
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(!compact)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (expanded) inputRef.current?.focus()
  }, [expanded])

  function collapse() {
    if (!compact) return
    setTitle('')
    setExpanded(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    setLoading(true)
    try {
      await onAdd(trimmed)
      setTitle('')
      if (compact) setExpanded(false)
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') collapse()
  }

  if (compact && !expanded) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={() => setExpanded(true)}
        className="rounded-sm cursor-pointer text-muted-foreground hover:bg-slate-200 hover:text-foreground"
        aria-label="Add todo"
      >
        <Plus />
      </Button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        ref={inputRef}
        value={title}
        onChange={e => setTitle(e.target.value)}
        onBlur={collapse}
        onKeyDown={handleKeyDown}
        placeholder={compact ? 'Add...' : 'Add a new todo...'}
        disabled={loading}
        className={cn('flex-1 bg-white', compact && 'h-6 px-1.5 text-xs')}
      />
      {!compact && (
        <Button type="submit" disabled={loading || !title.trim()}>
          Add
        </Button>
      )}
    </form>
  )
}
