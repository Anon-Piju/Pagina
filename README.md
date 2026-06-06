# 🪐 Orbit — Tu dashboard personal

Dashboard local para trackear tareas, entrenamientos, nutrición, finanzas y hábitos.

---

## Stack

- **React 18 + Vite** — SPA estática, corre en local
- **Tailwind CSS** — estilos con utility classes
- **Supabase** — PostgreSQL en la nube como única dependencia de internet
- **date-fns** — manejo de fechas
- **Lucide React** — iconos

---

## Requisitos previos

- Node.js 18 o superior
- Una cuenta gratuita en [supabase.com](https://supabase.com)

---

## 1. Configurar Supabase

1. Ve a [supabase.com](https://supabase.com) y crea un proyecto nuevo (plan gratuito es suficiente).
2. Una vez creado, ve a **SQL Editor** en el panel lateral.
3. Copia el contenido de `supabase_schema.sql` y ejecútalo. Esto crea todas las tablas.
4. Ve a **Settings → API** y copia:
   - **Project URL** → tu `VITE_SUPABASE_URL`
   - **anon / public key** → tu `VITE_SUPABASE_ANON_KEY`

---

## 2. Configurar el proyecto

```bash
# 1. Clona o descomprime el proyecto
cd habit-tracker

# 2. Instala dependencias
npm install

# 3. Crea el archivo de entorno
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales de Supabase:

```env
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 3. Arrancar en local

```bash
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

---

## Módulos incluidos

| Módulo | Ruta | Descripción |
|--------|------|-------------|
| Dashboard | `/` | Vista general de acceso rápido |
| Tareas | `/tasks` | CRUD con 4 estados: Pendiente, En proceso, Hecho, Desechado |
| Entrenamiento | `/training` | Registro de sesiones, ejercicios, estrellas de rendimiento y calendario heatmap |
| Nutrición | `/nutrition` | Log diario de alimentos con macros (proteínas, carbos, grasas) |
| Finanzas | `/finance` | Inversiones con P&L y registro de ingresos/gastos |
| Hábitos | `/habits` | Hábitos con objetivos, log diario, racha y mini-heatmap |

---

## Estructura del proyecto

```
src/
├── modules/
│   ├── dashboard/   Dashboard.jsx
│   ├── tasks/       Tasks.jsx
│   ├── training/    Training.jsx
│   ├── nutrition/   Nutrition.jsx
│   ├── finance/     Finance.jsx
│   └── habits/      Habits.jsx
├── components/
│   └── Layout.jsx   (sidebar + routing)
├── lib/
│   └── supabase.js  (cliente Supabase)
├── styles/
│   └── globals.css  (design tokens + clases base)
├── App.jsx
└── main.jsx
```

---

## Build para producción

```bash
npm run build
# Los archivos estáticos quedan en /dist
# Puedes subirlos a Vercel, Netlify o cualquier hosting estático
```

---

## Próximas versiones (roadmap)

- [ ] Autenticación con Supabase Auth (login propio)
- [ ] Apartado de progreso con fotos (diario estético)
- [ ] Menús de comidas preestablecidos (plantillas)
- [ ] Gráficas de evolución por módulo
- [ ] Modo offline con sincronización
- [ ] Exportación de datos a CSV
