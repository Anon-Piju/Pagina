import { useState, useEffect } from 'react'
import { Plus, Trash2, CheckCircle2, Circle, Target } from 'lucide-react'
import { format, eachDayOfInterval, subDays } from 'date-fns'
import { supabase } from '../../lib/supabase'

const HABIT_ICONS = ['📚','🏃','💧','🧘','✍️','🎯','🌙','🍎','💪','🎵','🧠','🌅']

export default function Habits() {
  const [habits, setHabits] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', icon: '📚', target_value: '', target_unit: '', goal_notes: '' })
  const today = format(new Date(), 'yyyy-MM-dd')

  // Last 14 days for mini-heatmap
  const last14 = eachDayOfInterval({ start: subDays(new Date(), 13), end: new Date() })
    .map(d => format(d, 'yyyy-MM-dd'))

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [{ data: h }, { data: l }] = await Promise.all([
      supabase.from('habits').select('*').order('created_at'),
      supabase.from('habit_logs').select('*').gte('date', format(subDays(new Date(), 30), 'yyyy-MM-dd')),
    ])
    setHabits(h || [])
    setLogs(l || [])
    setLoading(false)
  }

  async function saveHabit() {
    if (!form.name.trim()) return
    const { data, error } = await supabase
      .from('habits')
      .insert([{
        name: form.name.trim(),
        icon: form.icon,
        target_value: parseFloat(form.target_value) || null,
        target_unit: form.target_unit.trim() || null,
        goal_notes: form.goal_notes.trim() || null,
      }])
      .select().single()
    if (!error) {
      setHabits(prev => [...prev, data])
      setForm({ name: '', icon: '📚', target_value: '', target_unit: '', goal_notes: '' })
      setShowForm(false)
    }
  }

  async function toggleLog(habitId) {
    const existing = logs.find(l => l.habit_id === habitId && l.date === today)
    if (existing) {
      await supabase.from('habit_logs').delete().eq('id', existing.id)
      setLogs(prev => prev.filter(l => l.id !== existing.id))
    } else {
      const { data } = await supabase
        .from('habit_logs')
        .insert([{ habit_id: habitId, date: today, value: 1 }])
        .select().single()
      if (data) setLogs(prev => [...prev, data])
    }
  }

  async function deleteHabit(id) {
    await supabase.from('habit_logs').delete().eq('habit_id', id)
    await supabase.from('habits').delete().eq('id', id)
    setHabits(prev => prev.filter(h => h.id !== id))
    setLogs(prev => prev.filter(l => l.habit_id !== id))
  }

  function isDone(habitId, date) {
    return logs.some(l => l.habit_id === habitId && l.date === date)
  }

  function streak(habitId) {
    let count = 0
    const sortedDays = [...last14].reverse()
    for (const day of sortedDays) {
      if (isDone(habitId, day)) count++
      else break
    }
    return count
  }

  const doneToday = habits.filter(h => isDone(h.id, today)).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="section-title">Hábitos</h1>
        <button onClick={() => setShowForm(v => !v)} className="btn-primary">
          <Plus size={15} /> Nuevo hábito
        </button>
      </div>

      {/* Today summary */}
      <div className="card flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-xl flex-shrink-0">
          🎯
        </div>
        <div>
          <p className="text-white font-medium">
            {doneToday} / {habits.length} hábitos completados hoy
          </p>
          <p className="text-zinc-500 text-sm">
            {doneToday === habits.length && habits.length > 0
              ? '¡Día perfecto! 🔥'
              : 'Sigue así, cada día cuenta.'}
          </p>
        </div>
      </div>

      {/* New habit form */}
      {showForm && (
        <div className="card space-y-4">
          <h2 className="font-medium text-white">Nuevo hábito</h2>
          <div className="flex flex-wrap gap-2">
            {HABIT_ICONS.map(ico => (
              <button key={ico} onClick={() => setForm(f => ({ ...f, icon: ico }))}
                className={`w-9 h-9 rounded-xl text-lg transition-all
                  ${form.icon === ico ? 'bg-accent/20 ring-1 ring-accent' : 'bg-surface-200 hover:bg-surface-300'}`}>
                {ico}
              </button>
            ))}
          </div>
          <input className="input" placeholder="Nombre del hábito (ej: Leer 30 minutos)" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <div className="grid grid-cols-2 gap-2">
            <input className="input" placeholder="Objetivo (ej: 30)" type="number" value={form.target_value}
              onChange={e => setForm(f => ({ ...f, target_value: e.target.value }))} />
            <input className="input" placeholder="Unidad (ej: minutos, páginas)" value={form.target_unit}
              onChange={e => setForm(f => ({ ...f, target_unit: e.target.value }))} />
          </div>
          <input className="input" placeholder="Notas / motivación (opcional)" value={form.goal_notes}
            onChange={e => setForm(f => ({ ...f, goal_notes: e.target.value }))} />
          <div className="flex gap-2">
            <button onClick={saveHabit} className="btn-primary">Guardar</button>
            <button onClick={() => setShowForm(false)} className="btn-ghost">Cancelar</button>
          </div>
        </div>
      )}

      {/* Habits list */}
      {loading ? (
        <p className="muted text-center py-8">Cargando...</p>
      ) : habits.length === 0 ? (
        <p className="muted text-center py-8">No hay hábitos configurados. ¡Crea el primero!</p>
      ) : (
        <div className="space-y-3">
          {habits.map(habit => {
            const done = isDone(habit.id, today)
            const s = streak(habit.id)
            return (
              <div key={habit.id} className={`card group transition-all ${done ? 'border-jade/30' : ''}`}>
                <div className="flex items-center gap-3">
                  {/* Check button */}
                  <button onClick={() => toggleLog(habit.id)} className="flex-shrink-0">
                    {done
                      ? <CheckCircle2 size={22} className="text-jade" />
                      : <Circle size={22} className="text-zinc-600 hover:text-zinc-400 transition-colors" />}
                  </button>

                  <span className="text-xl flex-shrink-0">{habit.icon}</span>

                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm ${done ? 'text-jade' : 'text-white'}`}>
                      {habit.name}
                    </p>
                    {habit.target_value && (
                      <p className="text-zinc-500 text-xs">
                        <Target size={10} className="inline mr-1" />
                        Objetivo: {habit.target_value} {habit.target_unit}
                      </p>
                    )}
                  </div>

                  {/* Streak */}
                  {s > 0 && (
                    <div className="text-center flex-shrink-0">
                      <p className="text-sm font-semibold text-amber">{s}🔥</p>
                      <p className="text-zinc-600 text-xs">racha</p>
                    </div>
                  )}

                  <button onClick={() => deleteHabit(habit.id)}
                    className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-rose transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Mini heatmap - últimos 14 días */}
                <div className="flex gap-1 mt-3 pl-1">
                  {last14.map(day => (
                    <div
                      key={day}
                      title={day}
                      className={`flex-1 h-2 rounded-full transition-all ${
                        isDone(habit.id, day)
                          ? 'bg-jade'
                          : day === today ? 'bg-surface-400' : 'bg-surface-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-zinc-700 text-xs mt-1 pl-1">últimos 14 días</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
