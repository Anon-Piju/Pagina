import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, X, ChevronDown } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const STATUSES = [
  { value: 'pending',   label: 'Pendiente',  cls: 'status-pending'   },
  { value: 'progress',  label: 'En proceso', cls: 'status-progress'  },
  { value: 'done',      label: 'Hecho',      cls: 'status-done'      },
  { value: 'discarded', label: 'Desechado',  cls: 'status-discarded' },
]

function StatusBadge({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()
  const current = STATUSES.find(s => s.value === value)

  useEffect(() => {
    function handleClick(e) { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)}
        className={`${current.cls} cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1`}>
        {current.label} <ChevronDown size={10} />
      </button>
      {open && (
        <div className="absolute top-7 left-0 z-20 card-sm w-36 space-y-0.5 shadow-xl">
          {STATUSES.map(s => (
            <button key={s.value} onClick={() => { onChange(s.value); setOpen(false) }}
              className={`w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-surface-300 transition-colors ${s.value === value ? 'bg-surface-300' : ''}`}>
              <span className={s.cls}>{s.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Tasks() {
  const [tasks, setTasks]     = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc]   = useState('')
  const formRef = useRef()
  const titleRef = useRef()

  useEffect(() => { loadTasks() }, [])

  useEffect(() => {
    if (showForm) titleRef.current?.focus()
  }, [showForm])

  async function loadTasks() {
    setLoading(true)
    const { data, error } = await supabase
      .from('tasks').select('*').order('created_at', { ascending: false })
    if (!error) setTasks(data || [])
    setLoading(false)
  }

  async function addTask() {
    if (!newTitle.trim()) return
    const { data, error } = await supabase
      .from('tasks')
      .insert([{ title: newTitle.trim(), description: newDesc.trim(), status: 'pending' }])
      .select().single()
    if (!error) {
      setTasks(prev => [data, ...prev])
      setNewTitle('')
      setNewDesc('')
      setShowForm(false)
    }
  }

  async function updateStatus(id, status) {
    await supabase.from('tasks').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t))
  }

  async function deleteTask(id) {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)
  const counts = STATUSES.reduce((acc, s) => {
    acc[s.value] = tasks.filter(t => t.status === s.value).length
    return acc
  }, {})

  return (
    <div className="space-y-5 relative">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Tareas</h1>
          <p className="muted mt-0.5">{tasks.length} tareas en total</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className={`btn-primary transition-all ${showForm ? 'bg-surface-400 text-zinc-300' : ''}`}>
          {showForm ? <><X size={15} /> Cerrar</> : <><Plus size={15} /> Nueva tarea</>}
        </button>
      </div>

      {/* Collapsible form */}
      <div className={`overflow-hidden transition-all duration-300 ${showForm ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="card space-y-3" ref={formRef}>
          <input ref={titleRef} className="input" placeholder="Título de la tarea..."
            value={newTitle} onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTask()} />
          <input className="input" placeholder="Descripción (opcional)..."
            value={newDesc} onChange={e => setNewDesc(e.target.value)} />
          <div className="flex gap-2">
            <button onClick={addTask} className="btn-primary"><Plus size={15} /> Añadir</button>
            <button onClick={() => setShowForm(false)} className="btn-ghost">Cancelar</button>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        <button onClick={() => setFilter('all')}
          className={`btn text-sm py-1 ${filter === 'all' ? 'bg-surface-400 text-white' : 'btn-ghost'}`}>
          Todas <span className="text-zinc-500 ml-1 text-xs">{tasks.length}</span>
        </button>
        {STATUSES.map(s => (
          <button key={s.value} onClick={() => setFilter(s.value)}
            className={`btn text-sm py-1 ${filter === s.value ? 'bg-surface-400 text-white' : 'btn-ghost'}`}>
            {s.label} <span className="text-zinc-500 ml-1 text-xs">{counts[s.value]}</span>
          </button>
        ))}
      </div>

      {/* Task list */}
      {loading ? (
        <p className="muted text-center py-12">Cargando...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 space-y-2">
          <p className="text-zinc-600 text-4xl">✓</p>
          <p className="muted">No hay tareas en esta categoría.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(task => (
            <div key={task.id}
              className={`card flex items-start gap-3 group transition-opacity duration-200
                ${task.status === 'discarded' ? 'opacity-40' : ''}`}>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className={`font-medium text-sm leading-snug
                  ${task.status === 'done' ? 'line-through text-zinc-500' : 'text-white'}`}>
                  {task.title}
                </p>
                {task.description && (
                  <p className="text-zinc-500 text-xs mt-0.5">{task.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <StatusBadge value={task.status} onChange={val => updateStatus(task.id, val)} />
                <button onClick={() => deleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-rose transition-all p-0.5">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
