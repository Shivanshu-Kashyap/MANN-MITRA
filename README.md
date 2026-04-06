# Mann-Mitra

Mann-Mitra is a **mental health support platform** for institutions. It combines a **React** web app, a **Node.js** API (MongoDB, Socket.io, audits, rate limits), and an optional **Buddy** FastAPI service for **RAG-based chat**, risk scoring, and crisis-related signals.

---

## What is in this repository

| Part | Technology | Who it serves |
|------|------------|----------------|
| **`client/`** | React 19, Vite, Tailwind | **Students** (main UX), **counsellors**, **admins**; public pages (home, about, logins) |
| **`server/`** | Express 5, Mongoose, Socket.io | Auth, bookings, forum, screenings, admin APIs, chat HTTP API, real-time |
| **`buddy/`** | FastAPI, ChromaDB, optional Gemini | AI chat (`/chat`, `/chat/text`), RAG, decision engine, Mongo session storage |

Shared data lives in **MongoDB** (users, appointments, forum, screenings, chat sessions, etc.). **ChromaDB** is used by Buddy for vector search over the knowledge base.

---

## Roles and responsibilities

| Role | Typical tasks | Primary UI |
|------|----------------|------------|
| **Student** | Screening (PHQ-9 / GAD-7), AI chat (Buddy), book counsellors, forum, resources, certification paths | `/dashboard`, `/screening`, `/chat`, `/booking`, `/forum`, … |
| **Counsellor** | Login, dashboard, appointments, live chat platform (with students) | `/counsellor/login` → `/counsellor/dashboard`, `/chat-platform` |
| **Admin** | Org signup/login, executive dashboard, counsellor CRUD, analytics/crisis tabs | `/admin/signup`, `/admin/login` → `/admin/dashboard` |
| **Moderator** | Forum moderation (where implemented) | `/moderator` |

Auth is **JWT-based**. The client stores tokens under `Mann-Mitra_token` and/or `token`, and user JSON under `user` / `Mann-Mitra_user` (see `client/src/utils/routeAuth.js`).

---

## System architecture (high level)

```mermaid
flowchart TB
  subgraph Browser["Browser"]
    UI["React app (Vite)"]
  end

  subgraph APIs["Backend services"]
    Node["Node API :5000\nExpress + Socket.io"]
    Buddy["Buddy :8000\nFastAPI + RAG"]
  end

  subgraph Data["Data stores"]
    Mongo[(MongoDB)]
    Chroma[(ChromaDB)]
  end

  UI -->|"REST /api/v1/*\nJWT"| Node
  UI -->|"Buddy chat\nVITE_BUDDY_AGENT_URL"| Buddy
  Node --> Mongo
  Buddy --> Mongo
  Buddy --> Chroma
  Buddy -.->|"Risk alerts (when configured)"| Node
```

---

## End-to-end flows

### A. Student registration and session

```mermaid
sequenceDiagram
  participant S as Student browser
  participant C as client (React)
  participant A as Node API

  S->>C: Open /register
  C->>A: POST /api/v1/auth/register
  A-->>C: JWT + user
  C->>C: Store token + user (localStorage)
  S->>C: Visit /dashboard, /booking, …
  C->>A: Requests with Authorization Bearer
```

### B. AI chat (Buddy-first, as used by the Chat page)

The **`/chat`** page primarily talks to **Buddy** for responses (`POST /chat` or `POST /chat/text`), after checking `GET {BUDDY_URL}/health`. Buddy can persist sessions in **MongoDB** and may notify the Node server on elevated risk (see `buddy/README.md`).

```mermaid
flowchart LR
  subgraph Client["Chat.jsx"]
    H[Health check]
    T[Text / voice → Buddy]
  end

  BuddyAPI["Buddy /chat /chat/text"]
  Mongo[(MongoDB)]

  H --> BuddyAPI
  T --> BuddyAPI
  BuddyAPI --> Mongo
```

The Node API also exposes **`POST /api/v1/chat/message`** (optional auth, safety checks, `llm.service`) for an alternative or supplementary path—useful for integrations that do not call Buddy directly.

### C. Booking a counsellor

```mermaid
flowchart TD
  St[Student: /booking] --> List["GET /api/v1/counsellors"]
  List --> Slot["GET /api/v1/appointments/counsellor/:id/availability"]
  Slot --> Book["POST /api/v1/appointments"]
  Book --> Mongo[(MongoDB)]
```

### D. Admin manages counsellors

```mermaid
flowchart TD
  Ad[Admin dashboard] --> L["GET /api/v1/admin/counsellors"]
  Ad --> V["GET /api/v1/admin/counsellors/:id"]
  Ad --> E["PUT /api/v1/admin/counsellors/:id"]
  Ad --> D["PATCH .../status\nDELETE .../:id"]
  L & V & E & D --> Mongo[(MongoDB)]
```

---

## Quick start (local development)

### 1. MongoDB

Run MongoDB locally or use Atlas. You need a URI for both **server** and (if you use Buddy) **buddy**.

### 2. Node API

```bash
cd server
cp .env.example .env
# Set MONGO_URI, JWT_SECRET, CLIENT_URL, etc.
npm install
npm run dev
```

- Health: `GET http://localhost:5000/health`  
- API prefix: `/api/v1/...` (plus some **legacy** mounts under `/api/...`)

### 3. Frontend

```bash
cd client
cp .env.example .env
# VITE_API_URL=http://localhost:5000/api  (or http://localhost:5000 — see client README)
# VITE_BUDDY_AGENT_URL=http://localhost:8000
npm install
npm run dev
```

Default UI: **http://localhost:3000** (Vite proxies `/api` → port 5000 in dev).

### 4. Buddy (optional, for full AI chat)

```bash
cd buddy
# Python venv, pip install, .env with MONGO_URI, Chroma, GEMINI, etc.
# See buddy/README.md
```

Default Buddy: **http://localhost:8000**

---

## Default ports

| Service | Port |
|---------|------|
| React (Vite) | 3000 |
| Node API | 5000 |
| Buddy (FastAPI) | 8000 |

---

## Documentation map

| Document | Contents |
|----------|----------|
| **[client/README.md](client/README.md)** | All **routes/pages** by role, auth wrappers, env vars, how UI calls Node vs Buddy |
| **[server/README.md](server/README.md)** | Full **REST** surface: auth, appointments, counsellors, forum, screening, chat, admin |
| **[buddy/README.md](buddy/README.md)** | RAG pipeline, risk/decision engine, env vars, ingestion, deployment |

---

## Security

- Do **not** commit `.env` files or production secrets.  
- JWTs must use a strong `JWT_SECRET`.  
- This platform handles **sensitive mental health data**; follow your institution’s privacy and retention policies.

---

## License

Refer to the repository’s license file if present; otherwise treat usage as defined by your organization.
