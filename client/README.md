# Mann-Mitra Frontend

React 19 + Vite single-page application for **students**, **counsellors**, and **admins**: screening, AI chat (via **Buddy**), counsellor booking, forum, resources, certification flows, admin operations, and counsellor dashboards.

---

## Requirements

- **Node.js** 18+  
- **Mann-Mitra API** running (`../server`) — configure `VITE_API_URL`  
- **Buddy** (`../buddy`) optional but recommended for **`/chat`** — configure `VITE_BUDDY_AGENT_URL`

---

## Quick start

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Dev server: **http://localhost:3000** (`vite.config.js` proxies `/api` → `http://localhost:5000`).

---

## Environment variables (`.env`)

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | Node API base. Example: `http://localhost:5000/api` or `http://localhost:5000`. The admin **`useApi`** hook strips a trailing `/api` so paths like `/api/v1/admin/...` resolve correctly. |
| `VITE_BUDDY_AGENT_URL` | Buddy FastAPI base (default in code: `http://localhost:8000`). Used by **`Chat.jsx`** for `/health`, `/chat`, `/chat/text`. |
| `VITE_APP_NAME`, `VITE_APP_VERSION` | Display / metadata |
| `VITE_ENABLE_*` | Optional feature flags in `.env.example` |

---

## Authentication and route guards

| Mechanism | File | Behavior |
|-----------|------|----------|
| **`RoleProtectedRoute`** | `components/auth/RoleProtectedRoute.jsx` | Requires JWT + `user.role` matching `requiredRole` (`student`, `counsellor`, `admin`). Wrong role → redirected to that role’s dashboard. |
| **`StudentProtectedRoute`** | `components/auth/StudentProtectedRoute.jsx` | Requires **`student`** only. Used for booking, forum, screening, resources, certification, etc. |
| **`StudentOrCounsellorRoute`** | `components/auth/StudentOrCounsellorRoute.jsx` | Allows **`student`** or **`counsellor`** (e.g. live chat platform). |

**Storage keys** (see `utils/routeAuth.js`):

- Tokens: `Mann-Mitra_token`, `token`  
- User JSON: `user`, `Mann-Mitra_user`  

**Login entry points**

| Role | Path |
|------|------|
| Student | `/login`, `/register` |
| Admin | `/admin/login`, `/admin/signup` |
| Counsellor | `/counsellor/login` |

**Post-login home routes** (`ROLE_DASHBOARD`)

| Role | Dashboard path |
|------|----------------|
| Student | `/dashboard` |
| Counsellor | `/counsellor/dashboard` |
| Admin | `/admin/dashboard` |

---

## Pages and routes (from `App.jsx`)

Routes **without** the main chrome (no default footer on these wrappers):

| Path | Component | Guard | Notes |
|------|-----------|-------|-------|
| `/admin/dashboard` | `AdminDashboardNew` | `RoleProtectedRoute` **admin** | Overview, risk, counsellors, analytics tabs; uses `useApi` + `/api/v1/admin/...` |
| `/counsellor/dashboard` | `CounsellorDashboard` | **counsellor** | Counsellor workspace |
| `/chat-platform` | `ChatPlatform` | **student or counsellor** | Live chat platform |

**`/chat`** (full-height, header only):

| Path | Component | Guard |
|------|-----------|-------|
| `/chat` | `Chat` | **StudentProtectedRoute** |

`Chat.jsx` calls **Buddy** directly (`VITE_BUDDY_AGENT_URL`); it is not limited to axios `api.js` alone.

Routes **with** header + footer (`main` + `Footer`):

| Path | Component | Guard / access |
|------|-----------|----------------|
| `/` | `Home` | Public |
| `/about` | `About` | Public |
| `/login` | `Login` | Public |
| `/register` | `Register` | Public |
| `/admin/login` | `AdminLogin` | Public |
| `/admin/signup` | `AdminSignup` | Public |
| `/counsellor/login` | `CounsellorLogin` | Public |
| `/dashboard` | `StudentDashboard` | **student** |
| `/screening` | `Screening` | **student** |
| `/screenings/history` | `ScreeningHistory` | **student** |
| `/booking` | `Booking` | **student** |
| `/appointments` | `Appointments` | **student** |
| `/appointments/:id` | `AppointmentDetails` | **student** |
| `/forum` | `Forum` | **student** |
| `/resources` | `Resources` | **student** |
| `/certification/course/:courseId` | `CertificationCourse` | **student** |
| `/certification/exam` | `CertificationExam` | **student** |
| `/certification/schedule-exam` | `ScheduleExam` | **student** |
| `/certification/schedule-interview` | `ScheduleInterview` | **student** |
| `/moderator` | `Moderator` | No role guard in `App.jsx` — secure at API layer |
| `/admin` | `Admin` | Legacy/simple admin page |
| `*` | `NotFound` | — |

> **Note:** `AdminDashboard` is imported but not wired in the snippet above; the primary admin UI is **`/admin/dashboard`** → `AdminDashboardNew`.

---

## How the frontend calls backends

### 1. Axios client — `src/utils/api.js`

- `baseURL` = `VITE_API_URL` (default `http://localhost:5000/api`).  
- Used by **`authAPI`**, **`forumAPI`**, **`bookingAPI`**, etc. Paths are relative to that base (e.g. `/v1/forum/threads`, `/auth/login` depending on route).

### 2. Fetch wrapper — `src/hooks/useApi.js`

- Used heavily by **`AdminDashboardNew`**.  
- Builds URL from `VITE_API_URL` (strips trailing `/api`) + path such as `/api/v1/admin/overview`.

### 3. Buddy — direct `fetch` in `Chat.jsx`

- `GET {BUDDY}/health`  
- `POST {BUDDY}/chat` or `POST {BUDDY}/chat/text`  

---

## Feature → backend mapping (summary)

| Feature | Typical API / service |
|---------|------------------------|
| Student register/login | `POST /api/v1/auth/register`, `POST /api/v1/auth/login` |
| Admin login/signup | `POST /api/v1/auth/admin/login`, `POST /api/v1/auth/admin/signup` |
| Counsellor login | `POST /api/v1/auth/counsellor/login` |
| Profile | `GET/PUT /api/v1/auth/me` (with `protect`) |
| List counsellors (booking) | `GET /api/v1/counsellors` |
| Appointments | `GET/POST /api/v1/appointments`, availability routes (see server README) |
| Forum (threads, etc.) | `GET /api/v1/forum/threads`, posts, likes, reports — plus `forumAPI` in `api.js` |
| Screening | `POST /api/v1/screenings` (and legacy `/api/screening`) |
| AI chat UI | **Buddy** `/chat`, `/chat/text`; optional Node `POST /api/v1/chat/message` |
| Admin dashboard | `/api/v1/admin/*` (overview, counsellors CRUD, crisis, exports, …) |

---

## NPM scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` / `lint:fix` | ESLint |
| `npm run format` | Prettier |

---

## Project structure

```
client/
├── src/
│   ├── App.jsx                 # Top-level routes
│   ├── components/             # Header, Footer, auth, UI
│   ├── pages/                  # Screen-level components
│   ├── hooks/                  # useApi, etc.
│   ├── contexts/               # AuthContext
│   ├── utils/                  # api.js, routeAuth.js
│   ├── i18n/locales/           # en.json, hi.json
│   └── assets/
├── vite.config.js              # Dev server, PWA, proxy
├── .env.example
└── package.json
```

---

## Tech stack

React 19, React Router 7, Tailwind CSS 4, Framer Motion, i18next, TanStack Query, Axios, Formik, Yup, Socket.io client (where used), PWA (Workbox via `vite-plugin-pwa`).

---

## Role-based navigation (flowchart)

```mermaid
flowchart TD
  subgraph Public["Public (no student guard)"]
    H[Home / About]
    SL[Student /login + /register]
    AL[/admin/login + /admin/signup]
    CL[/counsellor/login]
  end

  subgraph Student["Student-only routes"]
    SD[/dashboard]
    SC[/screening]
    BK[/booking]
    AP[/appointments]
    FR[/forum]
    RS[/resources]
    CH[/chat → Buddy]
    CE[/certification/*]
  end

  subgraph Counsellor["Counsellor"]
    CD[/counsellor/dashboard]
    CP[/chat-platform]
  end

  subgraph Admin["Admin"]
    AD[/admin/dashboard]
  end

  SL --> SD
  AL --> AD
  CL --> CD
  SD --> SC
  SD --> BK
  SD --> CH
  CD --> CP
```

> **`/moderator`** and **`/admin`** (legacy page) are separate routes; enforce moderator/admin access on the API.

---

## Related docs

- **[../README.md](../README.md)** — platform overview, architecture diagrams, ports  
- **[../server/README.md](../server/README.md)** — complete REST API reference  
- **[../buddy/README.md](../buddy/README.md)** — Buddy RAG chat and operations  
