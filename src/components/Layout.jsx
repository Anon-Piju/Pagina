import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, CheckSquare, Dumbbell, UtensilsCrossed,
  TrendingUp, BookOpen, ChevronRight
} from 'lucide-react'

const NAV = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tasks',     icon: CheckSquare,     label: 'Tareas' },
  { to: '/training',  icon: Dumbbell,        label: 'Entrenamiento' },
  { to: '/nutrition', icon: UtensilsCrossed, label: 'Nutrición' },
  { to: '/finance',   icon: TrendingUp,      label: 'Finanzas' },
  { to: '/habits',    icon: BookOpen,        label: 'Hábitos' },
]

export default function Layout() {
  const location = useLocation()

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col bg-surface-100 border-r border-surface-300">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-surface-300">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-white text-xs font-bold">O</span>
            </div>
            <span className="font-semibold text-white tracking-tight">Orbit</span>
          </div>
          <p className="text-zinc-600 text-xs mt-1">Tu dashboard personal</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label }) => {
            const isActive = to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(to)
            return (
              <NavLink
                key={to}
                to={to}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} className={isActive ? 'text-accent-bright' : ''} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight size={12} className="text-zinc-600" />}
              </NavLink>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-surface-300">
          <p className="text-zinc-700 text-xs">v1.0.0 — local</p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="fade-up max-w-5xl mx-auto px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
