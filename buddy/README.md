# Buddy — RAG Mental Health Chatbot Service

A FastAPI-based microservice that powers the Mann-Mitra mental health chatbot with **Retrieval-Augmented Generation (RAG)**, **real-time risk detection**, **counsellor recommendations**, and **admin crisis alerts**.

---

## Architecture Overview

```
User Message
     │
     ▼
┌─────────────────────────────────────────────┐
│              FastAPI (Buddy Service)         │
│                                             │
│  ┌─────────────┐    ┌────────────────────┐  │
│  │  RAG Pipeline│    │ Risk Detection     │  │
│  │  (Parallel)  │    │ Pipeline (Parallel)│  │
│  │             │    │                    │  │
│  │ Query →     │    │ NLP Keyword Scan → │  │
│  │ VectorDB →  │    │ Emotional Weight → │  │
│  │ Context →   │    │ History Trend →    │  │
│  │ Gemini Reply│    │ Risk Score 0-100   │  │
│  └──────┬──────┘    └────────┬───────────┘  │
│         │                    │              │
│         ▼                    ▼              │
│  ┌─────────────────────────────────────┐    │
│  │         Decision Engine             │    │
│  │                                     │    │
│  │  LOW    → Self-help + RAG advice    │    │
│  │  MEDIUM → Coping + Optional counsel │    │
│  │  HIGH   → Recommend counsellor      │    │
│  │  CRITICAL → Crisis module + Alert   │    │
│  └──────────────────┬──────────────────┘    │
│                     │                       │
└─────────────────────┼───────────────────────┘
                      │
         ┌────────────┼────────────┐
         ▼            ▼            ▼
    Response to    MongoDB       Node.js Server
    Frontend       Persistence   (Socket.io Alert)
```

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | FastAPI + Uvicorn |
| Vector DB | ChromaDB (persistent, cosine similarity) |
| Embeddings | Google Gemini `text-embedding-004` or SentenceTransformers `all-MiniLM-L6-v2` (fallback) |
| LLM | Google Gemini `gemini-2.0-flash` (free tier, with rule-based fallback) |
| Database | MongoDB (via Motor async driver) — same instance as Node.js server |
| Document Ingestion | PyPDF + LangChain text splitters |
| Risk Detection | Custom NLP keyword classifier with weighted scoring |

---

## Folder Structure

```
buddy/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI entry point, lifespan, CORS
│   ├── config.py                  # Pydantic settings from .env
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py             # All Pydantic request/response models
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── document_loader.py     # PDF/text ingestion + chunking + metadata
│   │   ├── vector_store.py        # ChromaDB integration (store & query)
│   │   ├── rag_engine.py          # RAG pipeline (retrieve → context → Gemini)
│   │   ├── risk_detector.py       # NLP risk detection (keywords + weights)
│   │   ├── risk_scorer.py         # Weighted risk score calculation (0-100)
│   │   ├── decision_engine.py     # Routes response by risk level
│   │   └── session_store.py       # MongoDB persistence (sessions, alerts)
│   │
│   └── api/
│       ├── __init__.py
│       └── routes.py              # All API endpoints
│
├── knowledge_base/
│   └── sample_documents/          # Pre-loaded mental health resources
│       ├── anxiety_management.txt
│       ├── cbt_guide.txt
│       ├── crisis_intervention.txt
│       ├── depression_awareness.txt
│       └── stress_management.txt
│
├── seed_knowledge_base.py         # One-time script to populate ChromaDB
├── requirements.txt
├── .env                           # Local config (not committed)
├── .env.example                   # Template for environment variables
├── .gitignore
└── README.md
```

---

## Setup & Installation

### Prerequisites

- Python 3.10+
- MongoDB instance (the same one used by the Node.js server)
- Google Gemini API key (free at [aistudio.google.com/apikey](https://aistudio.google.com/apikey))

### 1. Create virtual environment

```bash
cd buddy
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Key settings:

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | Yes | MongoDB connection string (same as Node.js server) |
| `GEMINI_API_KEY` | No | Google Gemini API key (free tier: 15 req/min, 1M tokens/day). Without it, rule-based fallback is used |
| `NODE_SERVER_URL` | Yes | Node.js server URL for forwarding crisis alerts via Socket.io |
| `CHROMA_PERSIST_DIR` | No | Where ChromaDB stores data (default: `./chroma_db`) |

### 4. Seed the knowledge base

Run once to load sample mental health documents into ChromaDB:

```bash
python seed_knowledge_base.py
```

This will:
- Read all `.txt` and `.pdf` files from `knowledge_base/sample_documents/`
- Chunk them into 500-token segments with 50-token overlap
- Auto-tag each chunk with topic and severity metadata
- Store embeddings in ChromaDB (using Gemini embeddings or SentenceTransformers)

### 5. Start the service

```bash
# Development (with auto-reload)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or directly
python -m app.main
```

The service starts at `http://localhost:8000`. Visit `http://localhost:8000/docs` for interactive Swagger API docs.

---

## API Endpoints

### Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/chat` | Full RAG chat — returns structured response with risk assessment, counsellor recommendation, coping exercises |
| `POST` | `/chat/text` | Simplified text endpoint — matches existing Buddy agent interface used by the React frontend |
| `GET` | `/chat/history/{session_id}` | Get conversation history with mood scores |
| `DELETE` | `/chat/sessions/{session_id}` | Clear a session |

**Example — POST /chat/text:**

```json
// Request
{
  "message": "I've been feeling really anxious about my exams",
  "session_id": "session_abc123"
}

// Response
{
  "text": "I understand you're feeling anxious about exams...",
  "session_id": "session_abc123",
  "risk_level": "medium",
  "risk_score": 35,
  "suggested_actions": ["optional_counselling", "coping_strategies", "breathing_exercise"],
  "counsellor_recommendation": {
    "recommended": true,
    "urgency": "moderate",
    "session_type": "chat",
    "message": "Talking to a counselor could be helpful..."
  },
  "coping_exercise": {
    "type": "relaxation",
    "title": "Progressive Muscle Relaxation",
    "instructions": ["..."],
    "duration": "10-15 minutes"
  }
}
```

### Knowledge Base

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/ingest/text` | Ingest a text document into the knowledge base |
| `POST` | `/ingest/pdf` | Upload and ingest a PDF file |
| `POST` | `/ingest/directory` | Bulk ingest all files from a directory |
| `GET` | `/knowledge-base/stats` | Get vector store statistics |
| `POST` | `/knowledge-base/search` | Semantic search against the knowledge base |

### Admin / Risk Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/risk-dashboard` | Full dashboard data: high-risk cases, alerts, severity distribution |
| `GET` | `/admin/alerts` | Recent risk alerts |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Service health check (vector store status, Gemini config, MongoDB status) |

---

## Risk Detection Pipeline

### How Risk Scoring Works

Every user message is analyzed through a multi-layer risk detection system:

**1. Keyword Analysis** — Weighted keyword dictionaries organized by severity:

| Category | Example Keywords | Weight Range |
|----------|-----------------|--------------|
| Critical | "kill myself", "suicide", "overdose" | 75–95 |
| High | "hopeless", "worthless", "no way out" | 45–70 |
| Medium | "depressed", "panic attack", "can't cope" | 25–50 |
| Low | "stressed", "tired", "worried" | 10–15 |

**2. Emotional Intensity** — Amplifiers like "extremely", "unbearable", "can't stop" multiply the base score (1.0x–1.5x).

**3. Repetition Factor** — If the same distress keywords appear across multiple messages in a session, the score increases.

**4. Historical Trend** — Analysis of negative patterns across the last 10 messages in conversation history.

### Risk Score Formula

```
Risk Score = (Emotional Intensity × 0.10)
           + (Self-Harm Probability × 0.25)
           + (Suicidal Ideation × 0.30)
           + (Anxiety/Panic × 0.10)
           + (Repetition Factor × 0.10)
           + (Historical Trend × 0.15)
```

Scaled to 0–100, then classified:

| Score | Level | Action |
|-------|-------|--------|
| 0–30 | **Low** | Supportive RAG advice, self-help resources |
| 31–60 | **Medium** | Coping strategies, optional counselling offer |
| 61–80 | **High** | Strongly recommend counselling, alert counsellor dashboard |
| 81–100 | **Critical** | Crisis module, grounding response, emergency helplines, admin alert |

**Hard Override:** If critical keywords (suicide, kill, die, overdose) are detected, the score floors at 81 (Critical).

---

## Decision Engine Routing

### Low Risk
- RAG-grounded supportive response (powered by Gemini)
- Self-help resource suggestions
- Journaling / mindfulness / breathing exercises

### Medium Risk
- RAG-grounded response with coping strategies
- Optional counselling recommendation ("Would you like to talk to a professional?")
- Muscle relaxation exercise

### High Risk
- RAG response + strong counselling recommendation
- Priority booking suggestion
- Anonymized alert sent to counsellor dashboard
- Breathing exercise

### Critical Risk
- Immediate grounding response (not RAG — hard-coded safe response)
- Emergency helpline numbers (911, 988, 741741, India helplines)
- Admin/counsellor alert via Node.js Socket.io
- Crisis response object sent to frontend (triggers CrisisModal)

---

## Integration with Node.js Server

The Buddy service connects to the Node.js server for two purposes:

### 1. Crisis Alerts (Buddy → Node.js)
When risk is HIGH or CRITICAL, the service sends a `POST /api/v1/chat/buddy-alert` to the Node.js server, which broadcasts the alert via Socket.io to all connected counsellors and admins in real time.

```
Buddy (Python)  →  POST /api/v1/chat/buddy-alert  →  Node.js Server
                                                         │
                                            Socket.io broadcast to:
                                            ├── counsellors room
                                            ├── admins room
                                            └── crisis_alerts room
```

### 2. MongoDB (Shared Database)
Both services share the same MongoDB instance. Buddy writes to:
- `chat_sessions` — conversation history, risk scores, mood trends
- `risk_alerts` — timestamped alert records

The admin dashboard in the React frontend reads from these collections via the Buddy service's `/admin/risk-dashboard` endpoint.

---

## Frontend Integration

The React frontend (`client/src/pages/Chat.jsx`) connects to Buddy at `VITE_BUDDY_AGENT_URL` (default `http://localhost:8000`).

### What the frontend receives:
- `reply` / `text` — the chatbot response (generated by Gemini)
- `risk_level` — displayed as a color-coded badge in the chat header
- `risk_score` — shown alongside the risk level
- `counsellor_recommendation` — rendered as an inline banner with "Book Now" button
- `coping_exercise` — rendered as a step-by-step exercise card within the message
- `suggested_actions` — rendered as clickable action buttons below messages
- `crisis_response` — triggers the CrisisModal with emergency numbers

### Admin Dashboard
The admin dashboard (`/admin/dashboard` → "Risk Dashboard" tab) polls the Buddy service every 30 seconds and shows:
- Severity distribution cards (Critical/High/Medium/Low)
- High-risk active cases with anonymized IDs and mood trend mini-charts
- Recent alert timeline

---

## Adding Knowledge Base Documents

### Via API (at runtime)

```bash
# Ingest a text document
curl -X POST http://localhost:8000/ingest/text \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Mindfulness Guide",
    "content": "Mindfulness is the practice of...",
    "category": "mindfulness",
    "severity_tags": ["low", "medium"]
  }'

# Upload a PDF
curl -X POST http://localhost:8000/ingest/pdf \
  -F "file=@/path/to/document.pdf" \
  -F "category=anxiety"
```

### Via file system (before startup)

1. Place `.txt`, `.md`, or `.pdf` files in `knowledge_base/sample_documents/`
2. Run `python seed_knowledge_base.py`
3. Restart the service

### Recommended documents to add:
- CBT workbook chapters
- WHO mental health fact sheets
- University counseling center guides
- Stress management worksheets
- Crisis intervention protocols
- Mindfulness and meditation guides

---

## Getting a Gemini API Key (Free)

1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and paste it as `GEMINI_API_KEY` in your `.env` file

**Free tier limits:**
- 15 requests per minute
- 1 million tokens per day
- 1,500 requests per day

This is more than enough for development and moderate usage.

---

## Running Without Gemini API Key

If `GEMINI_API_KEY` is not set, the service operates in **fallback mode**:

- **Embeddings:** Uses `all-MiniLM-L6-v2` (SentenceTransformers, runs locally)
- **LLM responses:** Rule-based responses matched by topic (anxiety, depression, stress, loneliness, crisis)
- **Risk detection:** Fully functional (keyword-based, no LLM dependency)
- **Risk scoring:** Fully functional
- **Decision engine:** Fully functional

This means the chatbot works out of the box without any API keys — just with reduced response quality.

---

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `HOST` | `0.0.0.0` | Server bind address |
| `PORT` | `8000` | Server port |
| `DEBUG` | `true` | Enable auto-reload |
| `MONGO_URI` | — | MongoDB connection string |
| `GEMINI_API_KEY` | — | Google Gemini API key (free at aistudio.google.com) |
| `GEMINI_MODEL` | `gemini-2.0-flash` | Gemini chat model |
| `EMBEDDING_MODEL` | `models/text-embedding-004` | Gemini embedding model |
| `CHROMA_PERSIST_DIR` | `./chroma_db` | ChromaDB storage path |
| `CHROMA_COLLECTION_NAME` | `mental_health_kb` | Collection name |
| `NODE_SERVER_URL` | `http://localhost:5000` | Node.js server for alerts |
| `RISK_THRESHOLD_MEDIUM` | `31` | Score threshold for medium risk |
| `RISK_THRESHOLD_HIGH` | `61` | Score threshold for high risk |
| `RISK_THRESHOLD_CRITICAL` | `81` | Score threshold for critical risk |
| `MAX_HISTORY_LENGTH` | `20` | Max conversation history messages |
| `RAG_TOP_K` | `5` | Number of vector search results |
| `CHUNK_SIZE` | `500` | Document chunk size (tokens) |
| `CHUNK_OVERLAP` | `50` | Chunk overlap (tokens) |
