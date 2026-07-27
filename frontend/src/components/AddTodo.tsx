import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Props {
  onAdd: (title: string) => Promise<void>
}

export function AddTodo({ onAdd }: Props) {
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    setLoading(true)
    try {
      await onAdd(trimmed)
      setTitle('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Add a new todo..."
        disabled={loading}
        className="flex-1"
      />
      <Button type="submit" disabled={loading || !title.trim()}>
        Add
      </Button>
    </form>
  )
}
