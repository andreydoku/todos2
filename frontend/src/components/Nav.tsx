import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

const links = [
  { to: '/all', label: 'All' },
  { to: '/day', label: 'Day' },
  { to: '/3-day', label: '3-Day' },
  { to: '/month', label: 'Month' },
]

export function Nav() {
  return (
    <nav className="flex gap-1 border-b border-slate-600 bg-slate-800 px-4 py-2">
      {links.map(link => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            cn(
              'rounded-sm px-3 py-1.5 text-sm text-neutral-300 transition-colors hover:bg-slate-200 hover:text-black',
              isActive && 'bg-slate-600 text-white',
            )
          }
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  )
}
