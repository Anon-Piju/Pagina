import { CheckSquare, Dumbbell, TrendingUp, BookOpen } from 'lucide-react'
import { Link } from 'react-router-dom'

const cards = [
  {
    to: '/tasks',
    icon: CheckSquare,
    label: 'Tareas',
    color: 'text-accent-bright',
    bg: 'bg-accent/10',
    desc: 'Gestiona tu lista de pendientes',
  },
  {
    to: '/training',
    icon: Dumbbell,
    label: 'Entrenamiento',
    color: 'text-jade',
    bg: 'bg-jade/10',
    desc: 'Registra tus sesiones y progreso',
  },
  {
    to: '/finance',
    icon: TrendingUp,
    label: 'Finanzas',
    color: 'text-amber',
    bg: 'bg-amber/10',
    desc: 'Inversiones y gestión de dinero',
  },
  {
    to: '/habits',
    icon: BookOpen,
    label: 'Hábitos',
    color: 'text-sky',
    bg: 'bg-sky/10',
    desc: 'Objetivos y seguimiento diario',
  },
]

export default function Dashboard() {
  const today = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long'
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-zinc-500 text-sm capitalize">{today}</p>
        <h1 className="text-3xl font-semibold text-white mt-1">
          Bienvenido de vuelta 👋
        </h1>
        <p className="text-zinc-500 mt-1">¿Qué quieres trackear hoy?</p>
      </div>

      {/* Quick access */}
      <div className="grid grid-cols-2 gap-4">
        {cards.map(({ to, icon: Icon, label, color, bg, desc }) => (
          <Link key={to} to={to} className="card hover:border-surface-400 transition-colors group">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon size={20} className={color} />
            </div>
            <h3 className="font-semibold text-white group-hover:text-accent-bright transition-colors">
              {label}
            </h3>
            <p className="text-zinc-500 text-sm mt-0.5">{desc}</p>
          </Link>
        ))}
      </div>

      {/* Placeholder stats */}
      <div className="card">
        <p className="muted text-center py-4">
          Las estadísticas del resumen aparecerán aquí una vez empieces a registrar datos.
        </p>
      </div>
    </div>
  )
}
