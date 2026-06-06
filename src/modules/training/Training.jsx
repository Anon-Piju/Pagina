import { useState, useEffect } from 'react'
import { Plus, Trash2, ChevronLeft, ChevronRight, Star, Edit2, X, Check, Flame, Clock, Dumbbell } from 'lucide-react'
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, subDays, eachDayOfInterval, differenceInCalendarDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '../../lib/supabase'

const SPLITS = [
  { id: 'push',  label: 'Push',  color: 'text-rose',  bg: 'bg-rose/10',  muscles: 'Pecho · Tríceps · Hombro' },
  { id: 'pull',  label: 'Pull',  color: 'text-sky',   bg: 'bg-sky/10',   muscles: 'Bíceps · Espalda' },
  { id: 'legs',  label: 'Legs',  color: 'text-jade',  bg: 'bg-jade/10',  muscles: 'Piernas' },
  { id: 'rest',  label: 'Rest',  color: 'text-zinc-500', bg: 'bg-surface-300', muscles: 'Descanso' },
]

const EXERCISES_BY_SPLIT = {
  push: [
    { id: 'bench',      label: 'Press banca' },
    { id: 'incline',    label: 'Press inclinado' },
    { id: 'ohp',        label: 'Press militar' },
    { id: 'dip',        label: 'Fondos' },
    { id: 'lateral',    label: 'Elevaciones laterales' },
    { id: 'tricep_ext', label: 'Extensión tríceps' },
    { id: 'facepull',   label: 'Face pull' },
  ],
  pull: [
    { id: 'pullup',     label: 'Dominadas' },
    { id: 'row',        label: 'Remo barra' },
    { id: 'cable_row',  label: 'Remo polea' },
    { id: 'lat_pull',   label: 'Jalón al pecho' },
    { id: 'curl',       label: 'Curl bíceps' },
    { id: 'hammer',     label: 'Curl martillo' },
    { id: 'rdl',        label: 'RDL' },
  ],
  legs: [
    { id: 'squat',      label: 'Sentadilla' },
    { id: 'leg_press',  label: 'Prensa' },
    { id: 'lunges',     label: 'Zancadas' },
    { id: 'leg_curl',   label: 'Curl femoral' },
    { id: 'calf',       label: 'Gemelos' },
    { id: 'hip_thrust', label: 'Hip thrust' },
    { id: 'plank',      label: 'Plancha' },
  ],
}

// ─── Calendar Heatmap ─────────────────────────────────────────
function CalendarHeatmap({ workouts }) {
  const last84 = eachDayOfInterval({ start: subDays(new Date(), 83), end: new Date() })
  const weeks = []
  for (let i = 0; i < last84.length; i += 7) weeks.push(last84.slice(i, i + 7))

  function getSplit(day) {
    return workouts.find(w => isSameDay(new Date(w.date), day))?.split_id
  }

  const splitMap = Object.fromEntries(SPLITS.map(s => [s.id, s]))

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map(day => {
              const splitId = getSplit(day)
              const split = splitId ? splitMap[splitId] : null
              const isToday = isSameDay(day, new Date())
              return (
                <div key={day.toISOString()} title={`${format(day, 'd MMM', { locale: es })}${split ? ` — ${split.label}` : ''}`}
                  className={`w-3.5 h-3.5 rounded-sm transition-all
                    ${split && split.id !== 'rest'
                      ? split.id === 'push' ? 'bg-rose/70 hover:bg-rose'
                      : split.id === 'pull' ? 'bg-sky/70 hover:bg-sky'
                      : 'bg-jade/70 hover:bg-jade'
                      : 'bg-surface-300 hover:bg-surface-400'}
                    ${isToday ? 'ring-1 ring-white/40' : ''}`} />
              )
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 text-xs text-zinc-600">
        {SPLITS.filter(s => s.id !== 'rest').map(s => (
          <span key={s.id} className="flex items-center gap-1">
            <span className={`w-2.5 h-2.5 rounded-sm inline-block
              ${s.id === 'push' ? 'bg-rose/70' : s.id === 'pull' ? 'bg-sky/70' : 'bg-jade/70'}`} />
            {s.label}
          </span>
        ))}
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm inline-block bg-surface-300" /> Descanso
        </span>
      </div>
    </div>
  )
}

// ─── Stats bar ────────────────────────────────────────────────
function StatsBar({ workouts }) {
  const trained = workouts.filter(w => w.split_id !== 'rest')

  // Current streak
  let streak = 0
  for (let i = 0; i < 60; i++) {
    const day = format(subDays(new Date(), i), 'yyyy-MM-dd')
    if (trained.some(w => w.date === day)) streak++
    else if (i > 0) break
  }

  const avgDuration = trained.length > 0
    ? Math.round(trained.filter(w => w.duration_min).reduce((a, w) => a + (w.duration_min || 0), 0) / trained.filter(w => w.duration_min).length)
    : 0

  const thisWeek = trained.filter(w => {
    const d = new Date(w.date)
    const now = new Date()
    const weekAgo = subDays(now, 7)
    return d >= weekAgo && d <= now
  }).length

  const stats = [
    { label: 'Racha actual', value: streak > 0 ? `${streak}🔥` : '0', sub: 'días seguidos' },
    { label: 'Esta semana',  value: thisWeek, sub: 'entrenos' },
    { label: 'Total',        value: trained.length, sub: 'sesiones' },
    { label: 'Duración media', value: avgDuration > 0 ? `${avgDuration}′` : '—', sub: 'por sesión' },
  ]

  return (
    <div className="grid grid-cols-4 gap-3">
      {stats.map(({ label, value, sub }) => (
        <div key={label} className="card-sm text-center">
          <p className="text-xl font-semibold text-white">{value}</p>
          <p className="text-zinc-500 text-xs mt-0.5">{sub}</p>
          <p className="text-zinc-700 text-[10px]">{label}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Weekly planner ───────────────────────────────────────────
function WeeklyPlanner({ workouts, onRefresh }) {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [editing, setEditing]     = useState(false)
  const [draggingSplit, setDraggingSplit] = useState(null)
  const [expandedDay, setExpandedDay]    = useState(null)
  const [showLog, setShowLog]            = useState(null) // date string

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  function getWorkout(day) {
    return workouts.find(w => w.date === format(day, 'yyyy-MM-dd'))
  }

  async function assignSplit(day, splitId) {
    const dateStr = format(day, 'yyyy-MM-dd')
    const existing = workouts.find(w => w.date === dateStr)
    if (existing) {
      await supabase.from('workouts').update({ split_id: splitId }).eq('id', existing.id)
    } else {
      await supabase.from('workouts').insert([{ date: dateStr, split_id: splitId, performance_rating: 3 }])
    }
    onRefresh()
  }

  async function clearDay(day) {
    const dateStr = format(day, 'yyyy-MM-dd')
    const w = workouts.find(w => w.date === dateStr)
    if (w) { await supabase.from('workouts').delete().eq('id', w.id); onRefresh() }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => setWeekStart(w => subWeeks(w, 1))} className="btn-ghost px-2"><ChevronLeft size={16} /></button>
        <p className="text-sm font-medium text-white">
          {format(weekStart, "d MMM", { locale: es })} — {format(addDays(weekStart, 6), "d MMM yyyy", { locale: es })}
        </p>
        <button onClick={() => setWeekStart(w => addWeeks(w, 1))} className="btn-ghost px-2"><ChevronRight size={16} /></button>
      </div>

      <div className="flex justify-end">
        <button onClick={() => setEditing(v => !v)}
          className={`btn text-xs py-1 gap-1 ${editing ? 'btn-primary' : 'btn-ghost'}`}>
          <Edit2 size={12} /> {editing ? 'Listo' : 'Editar semana'}
        </button>
      </div>

      {/* Drag palette */}
      {editing && (
        <div className="card-sm flex items-center gap-2 flex-wrap">
          <p className="text-xs text-zinc-500 mr-1">Arrastra al día:</p>
          {SPLITS.map(split => (
            <div key={split.id} draggable
              onDragStart={() => setDraggingSplit(split.id)}
              className={`badge ${split.bg} ${split.color} cursor-grab active:cursor-grabbing text-xs font-medium`}>
              {split.label}
            </div>
          ))}
        </div>
      )}

      {/* Day columns */}
      <div className="grid grid-cols-7 gap-1.5">
        {days.map(day => {
          const w = getWorkout(day)
          const split = w ? SPLITS.find(s => s.id === w.split_id) : null
          const isToday = isSameDay(day, new Date())
          const isExpanded = expandedDay === day.toISOString()

          return (
            <div key={day.toISOString()}
              onDragOver={editing ? e => e.preventDefault() : undefined}
              onDrop={editing ? e => { e.preventDefault(); if (draggingSplit) assignSplit(day, draggingSplit) } : undefined}
              className="space-y-1">
              {/* Day header */}
              <div className={`text-center py-1 rounded-lg text-xs font-medium
                ${isToday ? 'bg-accent/20 text-accent-bright' : 'text-zinc-500'}`}>
                <div>{format(day, 'EEE', { locale: es })}</div>
                <div className="font-semibold text-white">{format(day, 'd')}</div>
              </div>

              {/* Split cell */}
              <div
                onClick={() => !editing && setExpandedDay(isExpanded ? null : day.toISOString())}
                className={`rounded-xl border p-2 min-h-[60px] flex flex-col items-center justify-center gap-1
                  transition-all cursor-pointer text-xs
                  ${split
                    ? `${split.bg} border-transparent hover:opacity-90`
                    : editing
                      ? 'border-dashed border-surface-400 hover:border-accent/40'
                      : 'bg-surface-200 border-surface-300'}
                  ${isExpanded ? 'ring-1 ring-accent' : ''}`}>
                {split ? (
                  <>
                    <span className={`font-semibold ${split.color}`}>{split.label}</span>
                    <span className="text-zinc-500 text-[10px] text-center leading-tight">{split.muscles}</span>
                    {w?.performance_rating && (
                      <div className="flex gap-0.5 mt-0.5">
                        {[1,2,3,4,5].map(n => (
                          <Star key={n} size={8} className={n <= w.performance_rating ? 'fill-amber text-amber' : 'text-zinc-700'} />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <span className="text-zinc-700">{editing ? 'Suelta aquí' : '—'}</span>
                )}
              </div>

              {/* Expanded detail */}
              {isExpanded && split && split.id !== 'rest' && (
                <div className="card-sm space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <p className={`font-medium ${split.color}`}>{split.label}</p>
                    <button onClick={() => setExpandedDay(null)}><X size={11} className="text-zinc-500" /></button>
                  </div>
                  {(EXERCISES_BY_SPLIT[split.id] || []).map(ex => (
                    <p key={ex.id} className="text-zinc-400 flex items-center gap-1">
                      <span className={`w-1 h-1 rounded-full inline-block ${split.id === 'push' ? 'bg-rose' : split.id === 'pull' ? 'bg-sky' : 'bg-jade'}`} />
                      {ex.label}
                    </p>
                  ))}
                  <button onClick={() => { setShowLog(format(day, 'yyyy-MM-dd')); setExpandedDay(null) }}
                    className="btn-ghost text-[11px] py-1 w-full justify-center mt-1">
                    <Plus size={11} /> Registrar sesión
                  </button>
                  {editing && (
                    <button onClick={() => clearDay(day)} className="btn-danger text-[11px] py-1 w-full justify-center">
                      <Trash2 size={11} /> Quitar
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Log session form ─────────────────────────────────────────
function LogSession({ date, workouts, onClose, onRefresh }) {
  const existing = workouts.find(w => w.date === date)
  const split = existing ? SPLITS.find(s => s.id === existing.split_id) : null
  const exercises = split ? (EXERCISES_BY_SPLIT[split.id] || []) : []

  const [rows, setRows]   = useState([])
  const [perf, setPerf]   = useState(existing?.performance_rating || 3)
  const [dur, setDur]     = useState(existing?.duration_min || '')
  const [notes, setNotes] = useState(existing?.notes || '')
  const [exRow, setExRow] = useState({ exercise_id: '', sets: '', reps: '', weight: '' })

  async function save() {
    if (!existing) return
    await supabase.from('workouts').update({
      performance_rating: perf,
      duration_min: parseFloat(dur) || null,
      notes,
    }).eq('id', existing.id)
    if (rows.length > 0) {
      await supabase.from('workout_sets').insert(
        rows.map(r => ({ workout_id: existing.id, exercise_id: r.exercise_id,
          sets: parseInt(r.sets) || null, reps: parseInt(r.reps) || null, weight: parseFloat(r.weight) || null }))
      )
    }
    onRefresh(); onClose()
  }

  return (
    <div className="card space-y-4 border-accent/30">
      <div className="flex items-center justify-between">
        <p className="font-medium text-white">
          Registrar — {format(new Date(date), "d 'de' MMMM", { locale: es })}
          {split && <span className={`ml-2 text-sm ${split.color}`}>{split.label}</span>}
        </p>
        <button onClick={onClose}><X size={15} className="text-zinc-500" /></button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Rendimiento</label>
          <div className="flex gap-1 mt-1">
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={() => setPerf(n)}>
                <Star size={20} className={n <= perf ? 'fill-amber text-amber' : 'text-zinc-700'} />
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Duración (min)</label>
          <input className="input" type="number" placeholder="60" value={dur}
            onChange={e => setDur(e.target.value)} />
        </div>
      </div>

      {exercises.length > 0 && (
        <div className="space-y-2">
          <label className="label">Ejercicios</label>
          {rows.map((r, i) => {
            const ex = exercises.find(e => e.id === r.exercise_id)
            return (
              <div key={i} className="flex items-center gap-2 bg-surface-200 rounded-lg px-3 py-1.5 text-sm">
                <span className="flex-1 text-zinc-300">{ex?.label}</span>
                <span className="text-zinc-500 text-xs">{r.sets}×{r.reps} {r.weight && `@ ${r.weight}kg`}</span>
                <button onClick={() => setRows(prev => prev.filter((_, idx) => idx !== i))}
                  className="text-zinc-600 hover:text-rose"><Trash2 size={12} /></button>
              </div>
            )
          })}
          <div className="grid grid-cols-4 gap-2">
            <select className="select col-span-2" value={exRow.exercise_id}
              onChange={e => setExRow(r => ({ ...r, exercise_id: e.target.value }))}>
              <option value="">Ejercicio...</option>
              {exercises.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
            </select>
            <input className="input" placeholder="S×R (ej: 4×8)" value={`${exRow.sets}${exRow.reps ? '×'+exRow.reps : ''}`}
              onChange={e => { const [s,r] = e.target.value.split('×'); setExRow(ex => ({ ...ex, sets: s||'', reps: r||'' })) }} />
            <input className="input" placeholder="kg" value={exRow.weight}
              onChange={e => setExRow(r => ({ ...r, weight: e.target.value }))} />
          </div>
          <button onClick={() => { if (exRow.exercise_id) { setRows(p => [...p, { ...exRow, id: Date.now() }]); setExRow({ exercise_id: '', sets: '', reps: '', weight: '' }) }}}
            className="btn-ghost text-xs"><Plus size={12} /> Añadir ejercicio</button>
        </div>
      )}

      <div>
        <label className="label">Notas</label>
        <textarea className="input resize-none" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
      </div>

      <div className="flex gap-2">
        <button onClick={save} className="btn-primary"><Check size={15} /> Guardar sesión</button>
        <button onClick={onClose} className="btn-ghost">Cancelar</button>
      </div>
    </div>
  )
}

// ─── History tab ──────────────────────────────────────────────
function History({ workouts }) {
  const trained = workouts.filter(w => w.split_id && w.split_id !== 'rest')
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  return (
    <div className="space-y-3">
      {trained.length === 0
        ? <p className="muted text-center py-8">Sin sesiones registradas todavía.</p>
        : trained.map(w => {
          const split = SPLITS.find(s => s.id === w.split_id)
          return (
            <div key={w.id} className="card">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${split?.bg} flex items-center justify-center flex-shrink-0`}>
                  <Dumbbell size={16} className={split?.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white text-sm">
                      {format(new Date(w.date), "d 'de' MMMM", { locale: es })}
                    </p>
                    <span className={`badge ${split?.bg} ${split?.color} text-xs`}>{split?.label}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(n => (
                        <Star key={n} size={11} className={n <= (w.performance_rating||0) ? 'fill-amber text-amber' : 'text-zinc-700'} />
                      ))}
                    </div>
                    {w.duration_min && (
                      <span className="text-zinc-500 text-xs flex items-center gap-1">
                        <Clock size={10} /> {w.duration_min} min
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {w.notes && <p className="text-zinc-500 text-sm mt-2">{w.notes}</p>}
            </div>
          )
        })
      }
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────
export default function Training() {
  const [tab, setTab]         = useState('plan')
  const [workouts, setWorkouts] = useState([])
  const [showLog, setShowLog]   = useState(null)

  useEffect(() => { loadWorkouts() }, [])

  async function loadWorkouts() {
    const { data } = await supabase.from('workouts').select('*, workout_sets(*)')
      .order('date', { ascending: false })
    setWorkouts(data || [])
  }

  const TABS = [
    { v: 'plan',    l: 'Planificación' },
    { v: 'stats',   l: 'Estadísticas' },
    { v: 'history', l: 'Historial' },
  ]

  return (
    <div className="space-y-5">
      <h1 className="section-title">Entrenamiento</h1>

      <div className="flex gap-1.5">
        {TABS.map(({ v, l }) => (
          <button key={v} onClick={() => setTab(v)}
            className={`btn text-sm py-1.5 ${tab === v ? 'bg-surface-400 text-white' : 'btn-ghost'}`}>
            {l}
          </button>
        ))}
      </div>

      {showLog && (
        <LogSession date={showLog} workouts={workouts}
          onClose={() => setShowLog(null)} onRefresh={loadWorkouts} />
      )}

      {tab === 'plan' && (
        <WeeklyPlanner workouts={workouts} onRefresh={loadWorkouts} />
      )}

      {tab === 'stats' && (
        <div className="space-y-5">
          <StatsBar workouts={workouts} />
          <div className="card space-y-3">
            <h3 className="text-sm font-medium text-zinc-300">Historial — últimas 12 semanas</h3>
            <CalendarHeatmap workouts={workouts} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {SPLITS.filter(s => s.id !== 'rest').map(split => {
              const count = workouts.filter(w => w.split_id === split.id).length
              return (
                <div key={split.id} className={`card-sm ${split.bg}`}>
                  <p className={`text-xl font-semibold ${split.color}`}>{count}</p>
                  <p className="text-white text-sm font-medium">{split.label}</p>
                  <p className="text-zinc-500 text-xs">{split.muscles}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'history' && <History workouts={workouts} />}
    </div>
  )
}
