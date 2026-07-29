import { Navigate, Route, Routes } from 'react-router-dom'
import { TodosProvider, useTodos } from './context/TodosContext'
import { Nav } from './components/Nav'
import { todayISO } from './lib/date'
import { AllView } from './routes/AllView'
import { DayView } from './routes/DayView'
import { ThreeDayView } from './routes/ThreeDayView'
import { MonthView } from './routes/MonthView'

function AppShell() {
  const { loading, error } = useTodos()

  return (
    <main className="flex h-screen flex-col bg-slate-700">
      <Nav />
      <div className="min-h-0 flex-1 overflow-hidden p-6">
        {loading ? (
          <p className="text-center text-neutral-300">Loading...</p>
        ) : (
          <div className="flex h-full flex-col">
            {error && <p className="shrink-0 text-sm text-destructive text-center">{error}</p>}
            <div className="min-h-0 flex-1">
              <Routes>
                <Route path="/" element={<Navigate to="/all" replace />} />
                <Route path="/all" element={<AllView />} />
                <Route path="/day" element={<Navigate to={`/day/${todayISO()}`} replace />} />
                <Route path="/day/:date" element={<DayView />} />
                <Route path="/3-day" element={<Navigate to={`/3-day/${todayISO()}`} replace />} />
                <Route path="/3-day/:date" element={<ThreeDayView />} />
                <Route path="/month" element={<Navigate to={`/month/${todayISO()}`} replace />} />
                <Route path="/month/:date" element={<MonthView />} />
              </Routes>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default function App() {
  return (
    <TodosProvider>
      <AppShell />
    </TodosProvider>
  )
}
