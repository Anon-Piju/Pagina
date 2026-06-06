import { useState, useEffect } from 'react'
import { Plus, Trash2, Flame, ChevronLeft, ChevronRight, Edit2, X, Check, BookOpen, Apple, Calendar } from 'lucide-react'
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '../../lib/supabase'

const MEAL_SLOTS = ['Desayuno', 'Almuerzo / Comida', 'Merienda', 'Cena']

// ─── Macro bar ────────────────────────────────────────────────
function MacroBar({ protein, carbs, fat, calories }) {
  const total = protein * 4 + carbs * 4 + fat * 9
  if (!total) return null
  const pPct = Math.round((protein * 4 / total) * 100)
  const cPct = Math.round((carbs * 4 / total) * 100)
  const fPct = 100 - pPct - cPct
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-white">{Math.round(calories)}</span>
        <span className="text-zinc-500 text-sm">kcal</span>
      </div>
      <div className="flex rounded-full overflow-hidden h-2.5">
        <div className="bg-sky transition-all" style={{ width: `${pPct}%` }} />
        <div className="bg-amber transition-all" style={{ width: `${cPct}%` }} />
        <div className="bg-rose transition-all" style={{ width: `${fPct}%` }} />
      </div>
      <div className="flex gap-4 text-xs text-zinc-500">
        <span><span className="text-sky font-medium">{Math.round(protein)}g</span> proteína</span>
        <span><span className="text-amber font-medium">{Math.round(carbs)}g</span> carbos</span>
        <span><span className="text-rose font-medium">{Math.round(fat)}g</span> grasas</span>
      </div>
    </div>
  )
}

// ─── Foods DB tab ─────────────────────────────────────────────
function FoodsTab({ foods, onAdd, onDelete }) {
  const [form, setForm] = useState({ name: '', brand: '', cal: '', protein: '', carbs: '', fat: '' })
  const [search, setSearch] = useState('')

  async function save() {
    if (!form.name.trim() || !form.cal) return
    await onAdd({
      name: form.name.trim(),
      brand: form.brand.trim() || null,
      calories_per_100g: parseFloat(form.cal),
      protein_per_100g: parseFloat(form.protein) || 0,
      carbs_per_100g: parseFloat(form.carbs) || 0,
      fat_per_100g: parseFloat(form.fat) || 0,
    })
    setForm({ name: '', brand: '', cal: '', protein: '', carbs: '', fat: '' })
  }

  const filtered = foods.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    (f.brand || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <h3 className="text-sm font-medium text-zinc-300">Añadir alimento (por 100g)</h3>
        <div className="grid grid-cols-2 gap-2">
          <input className="input" placeholder="Nombre" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <input className="input" placeholder="Marca (opcional)" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} />
          <input className="input" placeholder="kcal" type="number" value={form.cal} onChange={e => setForm(f => ({ ...f, cal: e.target.value }))} />
          <input className="input" placeholder="Proteína (g)" type="number" value={form.protein} onChange={e => setForm(f => ({ ...f, protein: e.target.value }))} />
          <input className="input" placeholder="Carbos (g)" type="number" value={form.carbs} onChange={e => setForm(f => ({ ...f, carbs: e.target.value }))} />
          <input className="input" placeholder="Grasas (g)" type="number" value={form.fat} onChange={e => setForm(f => ({ ...f, fat: e.target.value }))} />
        </div>
        <button onClick={save} className="btn-primary"><Plus size={15} /> Guardar alimento</button>
      </div>
      <input className="input" placeholder="Buscar alimento..." value={search} onChange={e => setSearch(e.target.value)} />
      <div className="space-y-1.5">
        {filtered.map(f => (
          <div key={f.id} className="card-sm flex items-center gap-3 group">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium">{f.name} {f.brand && <span className="text-zinc-500 font-normal text-xs">— {f.brand}</span>}</p>
              <p className="text-xs text-zinc-600">{f.calories_per_100g} kcal · P:{f.protein_per_100g}g C:{f.carbs_per_100g}g G:{f.fat_per_100g}g <span className="text-zinc-700">/ 100g</span></p>
            </div>
            <button onClick={() => onDelete(f.id)} className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-rose transition-all">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        {filtered.length === 0 && <p className="muted text-center py-4">Sin resultados.</p>}
      </div>
    </div>
  )
}

// ─── Recipes tab ──────────────────────────────────────────────
function RecipesTab({ recipes, foods, onSave, onDelete }) {
  const [form, setForm]   = useState({ name: '', servings: '1', ingredients: [] })
  const [ing, setIng]     = useState({ food_id: '', quantity: '' })
  const [editing, setEditing] = useState(false)

  function addIng() {
    if (!ing.food_id || !ing.quantity) return
    const food = foods.find(f => f.id === ing.food_id)
    setForm(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { ...ing, id: Date.now(), food_name: food.name }]
    }))
    setIng({ food_id: '', quantity: '' })
  }

  function calcMacros(ingredients) {
    return ingredients.reduce((acc, ing) => {
      const food = foods.find(f => f.id === ing.food_id)
      if (!food) return acc
      const factor = parseFloat(ing.quantity) / 100
      return {
        cal:     acc.cal     + food.calories_per_100g * factor,
        protein: acc.protein + food.protein_per_100g  * factor,
        carbs:   acc.carbs   + food.carbs_per_100g    * factor,
        fat:     acc.fat     + food.fat_per_100g      * factor,
      }
    }, { cal: 0, protein: 0, carbs: 0, fat: 0 })
  }

  async function save() {
    if (!form.name.trim() || form.ingredients.length === 0) return
    const macros = calcMacros(form.ingredients)
    await onSave({
      name: form.name.trim(),
      servings: parseFloat(form.servings) || 1,
      ingredients: form.ingredients,
      calories_total: macros.cal,
      protein_total: macros.protein,
      carbs_total: macros.carbs,
      fat_total: macros.fat,
    })
    setForm({ name: '', servings: '1', ingredients: [] })
    setEditing(false)
  }

  return (
    <div className="space-y-4">
      {!editing ? (
        <button onClick={() => setEditing(true)} className="btn-primary w-full justify-center">
          <Plus size={15} /> Nueva receta
        </button>
      ) : (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-300">Nueva receta</h3>
            <button onClick={() => setEditing(false)} className="text-zinc-500 hover:text-white"><X size={15} /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input className="input col-span-2" placeholder="Nombre de la receta" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <input className="input" placeholder="Raciones (porciones)" type="number" value={form.servings}
              onChange={e => setForm(f => ({ ...f, servings: e.target.value }))} />
          </div>
          {form.ingredients.map((ing, i) => {
            const food = foods.find(f => f.id === ing.food_id)
            return (
              <div key={ing.id} className="flex items-center gap-2 bg-surface-200 rounded-lg px-3 py-2 text-sm">
                <span className="flex-1 text-zinc-300">{food?.name}</span>
                <span className="text-zinc-500">{ing.quantity}g</span>
                <button onClick={() => setForm(f => ({ ...f, ingredients: f.ingredients.filter((_, idx) => idx !== i) }))}
                  className="text-zinc-600 hover:text-rose"><Trash2 size={12} /></button>
              </div>
            )
          })}
          <div className="flex gap-2">
            <select className="select flex-1" value={ing.food_id}
              onChange={e => setIng(i => ({ ...i, food_id: e.target.value }))}>
              <option value="">Ingrediente...</option>
              {foods.map(f => <option key={f.id} value={f.id}>{f.name}{f.brand ? ` (${f.brand})` : ''}</option>)}
            </select>
            <input className="input w-24" placeholder="g" type="number" value={ing.quantity}
              onChange={e => setIng(i => ({ ...i, quantity: e.target.value }))} />
            <button onClick={addIng} className="btn-ghost px-3"><Plus size={15} /></button>
          </div>
          {form.ingredients.length > 0 && (() => {
            const m = calcMacros(form.ingredients)
            return <p className="text-xs text-zinc-500">Total: {Math.round(m.cal)} kcal · P:{Math.round(m.protein)}g · C:{Math.round(m.carbs)}g · G:{Math.round(m.fat)}g</p>
          })()}
          <button onClick={save} className="btn-primary"><Check size={15} /> Guardar receta</button>
        </div>
      )}
      <div className="space-y-2">
        {recipes.map(r => (
          <div key={r.id} className="card-sm group flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{r.name}</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {Math.round(r.calories_total)} kcal · {r.servings} ración{r.servings !== 1 ? 'es' : ''} ·
                P:{Math.round(r.protein_total)}g C:{Math.round(r.carbs_total)}g G:{Math.round(r.fat_total)}g
              </p>
            </div>
            <button onClick={() => onDelete(r.id)} className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-rose transition-all mt-0.5">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        {recipes.length === 0 && <p className="muted text-center py-4">Sin recetas aún.</p>}
      </div>
    </div>
  )
}

// ─── Weekly planner ───────────────────────────────────────────
function WeeklyPlanner({ recipes, foods, weekStart, onNavigate }) {
  const [plan, setPlan]       = useState({})   // { 'YYYY-MM-DD_Slot': [{ recipe_id, servings }] }
  const [dragging, setDragging] = useState(null)
  const [expandedCell, setExpandedCell] = useState(null)
  const [addingTo, setAddingTo] = useState(null)  // 'YYYY-MM-DD_Slot'
  const [addForm, setAddForm]   = useState({ recipe_id: '', servings: '1' })
  const [editing, setEditing]   = useState(false)

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  useEffect(() => { loadPlan() }, [weekStart])

  async function loadPlan() {
    const from = format(weekStart, 'yyyy-MM-dd')
    const to   = format(addDays(weekStart, 6), 'yyyy-MM-dd')
    const { data } = await supabase
      .from('meal_plan')
      .select('*')
      .gte('date', from)
      .lte('date', to)
    const map = {}
    ;(data || []).forEach(row => {
      const key = `${row.date}_${row.slot}`
      if (!map[key]) map[key] = []
      map[key].push(row)
    })
    setPlan(map)
  }

  async function addToPlan() {
    if (!addForm.recipe_id || !addingTo) return
    const [date, ...slotParts] = addingTo.split('_')
    const slot = slotParts.join('_')
    const recipe = recipes.find(r => r.id === addForm.recipe_id)
    const factor = parseFloat(addForm.servings) / (recipe.servings || 1)
    const { data } = await supabase.from('meal_plan').insert([{
      date, slot,
      recipe_id: addForm.recipe_id,
      recipe_name: recipe.name,
      servings: parseFloat(addForm.servings),
      calories: Math.round(recipe.calories_total * factor),
      protein_g: +(recipe.protein_total * factor).toFixed(1),
      carbs_g:   +(recipe.carbs_total   * factor).toFixed(1),
      fat_g:     +(recipe.fat_total     * factor).toFixed(1),
    }]).select().single()
    if (data) {
      const key = addingTo
      setPlan(prev => ({ ...prev, [key]: [...(prev[key] || []), data] }))
    }
    setAddingTo(null)
    setAddForm({ recipe_id: '', servings: '1' })
  }

  async function removeFromPlan(key, id) {
    await supabase.from('meal_plan').delete().eq('id', id)
    setPlan(prev => ({ ...prev, [key]: (prev[key] || []).filter(r => r.id !== id) }))
  }

  // drag from recipe list onto a cell
  function onDrop(e, key) {
    e.preventDefault()
    const recipeId = e.dataTransfer.getData('recipeId')
    if (!recipeId) return
    setAddingTo(key)
    setAddForm({ recipe_id: recipeId, servings: '1' })
  }

  // daily totals
  function dayTotals(day) {
    const dateStr = format(day, 'yyyy-MM-dd')
    return MEAL_SLOTS.reduce((acc, slot) => {
      const key = `${dateStr}_${slot}`
      ;(plan[key] || []).forEach(r => {
        acc.cal     += r.calories || 0
        acc.protein += r.protein_g || 0
      })
      return acc
    }, { cal: 0, protein: 0 })
  }

  return (
    <div className="space-y-4">
      {/* Week nav */}
      <div className="flex items-center justify-between">
        <button onClick={() => onNavigate(-1)} className="btn-ghost px-2"><ChevronLeft size={16} /></button>
        <p className="text-sm font-medium text-white">
          {format(weekStart, "d 'de' MMMM", { locale: es })} — {format(addDays(weekStart, 6), "d 'de' MMMM", { locale: es })}
        </p>
        <button onClick={() => onNavigate(1)} className="btn-ghost px-2"><ChevronRight size={16} /></button>
      </div>

      {/* Edit mode toggle */}
      <div className="flex justify-end">
        <button onClick={() => setEditing(v => !v)}
          className={`btn text-xs py-1 gap-1 ${editing ? 'btn-primary' : 'btn-ghost'}`}>
          <Edit2 size={12} /> {editing ? 'Terminando de editar' : 'Editar semana'}
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {days.map(day => {
          const isToday = isSameDay(day, new Date())
          const totals = dayTotals(day)
          return (
            <div key={day.toISOString()} className="space-y-1">
              <div className={`text-center py-1 rounded-lg text-xs font-medium
                ${isToday ? 'bg-accent/20 text-accent-bright' : 'text-zinc-500'}`}>
                <div>{format(day, 'EEE', { locale: es })}</div>
                <div className="font-semibold text-white">{format(day, 'd')}</div>
                {totals.cal > 0 && <div className="text-zinc-600 text-[10px]">{Math.round(totals.cal)} kcal</div>}
              </div>
              {MEAL_SLOTS.map(slot => {
                const key = `${format(day, 'yyyy-MM-dd')}_${slot}`
                const items = plan[key] || []
                const isExpanded = expandedCell === key
                return (
                  <div key={slot}
                    onDragOver={editing ? e => e.preventDefault() : undefined}
                    onDrop={editing ? e => onDrop(e, key) : undefined}
                    onClick={() => !editing && setExpandedCell(isExpanded ? null : key)}
                    className={`rounded-lg border text-[10px] transition-all cursor-pointer min-h-[32px]
                      ${items.length > 0
                        ? 'bg-accent/5 border-accent/20 hover:border-accent/40'
                        : editing
                          ? 'border-dashed border-surface-400 hover:border-accent/40 hover:bg-accent/5'
                          : 'border-surface-300'}
                      ${isExpanded ? 'col-span-1' : ''}`}>
                    {/* Collapsed view */}
                    {!isExpanded && (
                      <div className="p-1.5">
                        {items.length === 0 ? (
                          <p className="text-zinc-700 text-center leading-tight">{slot.split('/')[0].trim()}</p>
                        ) : (
                          <div className="space-y-0.5">
                            <p className="text-zinc-600 leading-tight truncate">{slot.split('/')[0].trim()}</p>
                            {items.map(it => (
                              <p key={it.id} className="text-zinc-300 truncate leading-tight">{it.recipe_name}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {/* Expanded view */}
                    {isExpanded && (
                      <div className="p-2 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <p className="text-zinc-400 font-medium">{slot}</p>
                          <button onClick={e => { e.stopPropagation(); setExpandedCell(null) }}
                            className="text-zinc-600 hover:text-white"><X size={11} /></button>
                        </div>
                        {items.map(it => (
                          <div key={it.id} className="flex items-center gap-1 group/it">
                            <div className="flex-1 min-w-0">
                              <p className="text-zinc-200 truncate">{it.recipe_name}</p>
                              <p className="text-zinc-600">{it.calories} kcal · P:{it.protein_g}g</p>
                            </div>
                            {editing && (
                              <button onClick={e => { e.stopPropagation(); removeFromPlan(key, it.id) }}
                                className="opacity-0 group-hover/it:opacity-100 text-rose"><Trash2 size={10} /></button>
                            )}
                          </div>
                        ))}
                        {editing && (
                          <button onClick={e => { e.stopPropagation(); setAddingTo(key) }}
                            className="btn-ghost text-[10px] py-0.5 w-full justify-center">
                            <Plus size={10} /> añadir
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Add-to-plan modal */}
      {addingTo && (
        <div className="card space-y-3 border-accent/30">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-white">Añadir a {addingTo.split('_').slice(1).join(' ')}</p>
            <button onClick={() => setAddingTo(null)}><X size={15} className="text-zinc-500" /></button>
          </div>
          <select className="select" value={addForm.recipe_id}
            onChange={e => setAddForm(f => ({ ...f, recipe_id: e.target.value }))}>
            <option value="">Selecciona una receta...</option>
            {recipes.map(r => <option key={r.id} value={r.id}>{r.name} ({Math.round(r.calories_total)} kcal / {r.servings} ración)</option>)}
          </select>
          <div className="flex gap-2 items-center">
            <label className="text-xs text-zinc-400 whitespace-nowrap">Raciones:</label>
            <input className="input w-20" type="number" step="0.5" value={addForm.servings}
              onChange={e => setAddForm(f => ({ ...f, servings: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <button onClick={addToPlan} className="btn-primary"><Check size={15} /> Añadir</button>
            <button onClick={() => setAddingTo(null)} className="btn-ghost">Cancelar</button>
          </div>
        </div>
      )}

      {/* Drag hint */}
      {editing && recipes.length > 0 && (
        <div className="card-sm">
          <p className="text-xs text-zinc-500 mb-2">Arrastra una receta al día que quieras:</p>
          <div className="flex flex-wrap gap-1.5">
            {recipes.map(r => (
              <div key={r.id} draggable
                onDragStart={e => e.dataTransfer.setData('recipeId', r.id)}
                className="badge bg-surface-300 text-zinc-300 cursor-grab active:cursor-grabbing text-xs">
                {r.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Daily log tab ────────────────────────────────────────────
function DailyLog({ foods, recipes }) {
  const [meals, setMeals]   = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [form, setForm]     = useState({ meal_type: 'Almuerzo / Comida', food_id: '', quantity: '' })

  useEffect(() => { loadMeals() }, [selectedDate])

  async function loadMeals() {
    setLoading(true)
    const { data } = await supabase.from('nutrition_logs').select('*')
      .eq('date', selectedDate).order('created_at')
    setMeals(data || [])
    setLoading(false)
  }

  async function addEntry() {
    if (!form.food_id || !form.quantity) return
    const food = foods.find(f => f.id === form.food_id)
    if (!food) return
    const factor = parseFloat(form.quantity) / 100
    const { data, error } = await supabase.from('nutrition_logs').insert([{
      date: selectedDate,
      meal_type: form.meal_type,
      food_id: form.food_id,
      food_name: food.name,
      quantity_g: parseFloat(form.quantity),
      calories:  Math.round(food.calories_per_100g * factor),
      protein_g: +(food.protein_per_100g * factor).toFixed(1),
      carbs_g:   +(food.carbs_per_100g   * factor).toFixed(1),
      fat_g:     +(food.fat_per_100g     * factor).toFixed(1),
    }]).select().single()
    if (!error) { setMeals(prev => [...prev, data]); setForm(f => ({ ...f, food_id: '', quantity: '' })) }
  }

  async function deleteEntry(id) {
    await supabase.from('nutrition_logs').delete().eq('id', id)
    setMeals(prev => prev.filter(m => m.id !== id))
  }

  const totals = meals.reduce((acc, m) => ({
    cal: acc.cal + (m.calories || 0), protein: acc.protein + (m.protein_g || 0),
    carbs: acc.carbs + (m.carbs_g || 0), fat: acc.fat + (m.fat_g || 0),
  }), { cal: 0, protein: 0, carbs: 0, fat: 0 })

  const byType = MEAL_SLOTS.map(type => ({
    type, entries: meals.filter(m => m.meal_type === type)
  })).filter(g => g.entries.length > 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input type="date" className="input w-auto" value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)} />
      </div>
      <MacroBar protein={totals.protein} carbs={totals.carbs} fat={totals.fat} calories={totals.cal} />
      <div className="card space-y-3">
        <h3 className="text-sm font-medium text-zinc-300">Registrar alimento</h3>
        <div className="grid grid-cols-3 gap-2">
          <select className="select" value={form.meal_type}
            onChange={e => setForm(f => ({ ...f, meal_type: e.target.value }))}>
            {MEAL_SLOTS.map(t => <option key={t}>{t}</option>)}
          </select>
          <select className="select" value={form.food_id}
            onChange={e => setForm(f => ({ ...f, food_id: e.target.value }))}>
            <option value="">Alimento...</option>
            {foods.map(f => <option key={f.id} value={f.id}>{f.name}{f.brand ? ` (${f.brand})` : ''}</option>)}
          </select>
          <div className="flex gap-2">
            <input className="input" placeholder="g" type="number" value={form.quantity}
              onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && addEntry()} />
            <button onClick={addEntry} className="btn-primary px-3"><Plus size={15} /></button>
          </div>
        </div>
      </div>
      {loading ? <p className="muted text-center py-4">Cargando...</p> :
       byType.length === 0 ? <p className="muted text-center py-4">Nada registrado para este día.</p> : (
        <div className="space-y-3">
          {byType.map(({ type, entries }) => (
            <div key={type} className="card space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-white text-sm">{type}</h3>
                <span className="text-zinc-500 text-xs">{Math.round(entries.reduce((a, e) => a + (e.calories || 0), 0))} kcal</span>
              </div>
              {entries.map(entry => (
                <div key={entry.id} className="flex items-center gap-3 group py-1 border-t border-surface-300">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-200">{entry.food_name}</p>
                    <p className="text-xs text-zinc-600">{entry.quantity_g}g</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">{entry.calories} kcal</p>
                    <p className="text-xs text-zinc-600">P:{entry.protein_g}g C:{entry.carbs_g}g G:{entry.fat_g}g</p>
                  </div>
                  <button onClick={() => deleteEntry(entry.id)}
                    className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-rose transition-all">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────
export default function Nutrition() {
  const [tab, setTab]       = useState('daily')
  const [foods, setFoods]   = useState([])
  const [recipes, setRecipes] = useState([])
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))

  useEffect(() => { loadFoods(); loadRecipes() }, [])

  async function loadFoods() {
    const { data } = await supabase.from('foods').select('*').order('name')
    setFoods(data || [])
  }

  async function loadRecipes() {
    const { data } = await supabase.from('recipes').select('*').order('name')
    setRecipes(data || [])
  }

  async function addFood(food) {
    const { data } = await supabase.from('foods').insert([food]).select().single()
    if (data) setFoods(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
  }

  async function deleteFood(id) {
    await supabase.from('foods').delete().eq('id', id)
    setFoods(prev => prev.filter(f => f.id !== id))
  }

  async function saveRecipe(recipe) {
    const { data } = await supabase.from('recipes').insert([{
      name: recipe.name,
      servings: recipe.servings,
      ingredients: recipe.ingredients,
      calories_total: recipe.calories_total,
      protein_total: recipe.protein_total,
      carbs_total: recipe.carbs_total,
      fat_total: recipe.fat_total,
    }]).select().single()
    if (data) setRecipes(prev => [...prev, data])
  }

  async function deleteRecipe(id) {
    await supabase.from('recipes').delete().eq('id', id)
    setRecipes(prev => prev.filter(r => r.id !== id))
  }

  const TABS = [
    { v: 'daily',   l: 'Registro diario', icon: Flame },
    { v: 'weekly',  l: 'Menú semanal',    icon: Calendar },
    { v: 'recipes', l: 'Recetas',         icon: BookOpen },
    { v: 'foods',   l: 'Alimentos',       icon: Apple },
  ]

  return (
    <div className="space-y-5">
      <h1 className="section-title">Nutrición</h1>
      <div className="flex gap-1.5 flex-wrap">
        {TABS.map(({ v, l, icon: Icon }) => (
          <button key={v} onClick={() => setTab(v)}
            className={`btn text-sm py-1.5 gap-1.5 ${tab === v ? 'bg-surface-400 text-white' : 'btn-ghost'}`}>
            <Icon size={13} /> {l}
          </button>
        ))}
      </div>

      {tab === 'daily'   && <DailyLog foods={foods} recipes={recipes} />}
      {tab === 'weekly'  && <WeeklyPlanner recipes={recipes} foods={foods} weekStart={weekStart}
                              onNavigate={dir => setWeekStart(w => dir > 0 ? addWeeks(w, 1) : subWeeks(w, 1))} />}
      {tab === 'recipes' && <RecipesTab recipes={recipes} foods={foods} onSave={saveRecipe} onDelete={deleteRecipe} />}
      {tab === 'foods'   && <FoodsTab foods={foods} onAdd={addFood} onDelete={deleteFood} />}
    </div>
  )
}
