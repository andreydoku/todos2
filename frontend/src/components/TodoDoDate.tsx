import { useRef, useState } from 'react'
import { Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  doDate: string | null | undefined
  onSave: (doDate: string | null) => Promise<void>
}

function formatDoDate(doDate: string) {
  const [year, month, day] = doDate.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day, 12))
  const monthDay = date.toLocaleDateString(undefined, {
    month: 'short',
    day: '2-digit',
    timeZone: 'UTC',
  })
  const currentYear = new Date().getFullYear()
  return { monthDay, year: year !== currentYear ? String(year) : null }
}

export function TodoDoDate({ doDate, onSave }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [editing, setEditing] = useState(false)

  // Clicking the trigger would otherwise steal focus from the input first,
  // which closes the picker natively before our click handler runs.
  function preventFocusSteal(e: React.MouseEvent) {
    e.preventDefault()
  }

  function toggleEditing() {
    const input = inputRef.current
    if (!input) return
    if (editing) {
      input.blur()
      setEditing(false)
    } else {
      input.showPicker()
      setEditing(true)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value
    setEditing(false)
    if (newValue !== doDate) {
      onSave(newValue || null)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') setEditing(false)
  }

  const hiddenInput = (
    <input
      ref={inputRef}
      type="date"
      value={doDate ?? ''}
      onChange={handleChange}
      onBlur={() => setEditing(false)}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      className="absolute left-0 top-full h-px w-px opacity-0"
    />
  )

  if (doDate) {
    const { monthDay, year } = formatDoDate(doDate)
    return (
      <span className="relative inline-block">
        <button
          onMouseDown={preventFocusSteal}
          onClick={toggleEditing}
          aria-label="Change date"
          className="flex w-14 h-8 flex-col items-center justify-center rounded-sm text-xs leading-none text-muted-foreground cursor-pointer hover:bg-accent transition-colors"
        >
          <span>{monthDay}</span>
          {year && <span>{year}</span>}
        </button>
        {hiddenInput}
      </span>
    )
  }

  return (
    <span className="relative inline-block">
      <Button
        variant="ghost"
        size="icon-sm"
        onMouseDown={preventFocusSteal}
        onClick={toggleEditing}
        className="w-14 h-8 cursor-pointer text-muted-foreground hover:text-foreground"
        aria-label="Set date"
      >
        <Calendar />
      </Button>
      {hiddenInput}
    </span>
  )
}
