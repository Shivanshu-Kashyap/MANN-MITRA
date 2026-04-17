# Mann-Mitra Architecture Diagram

```mermaid
flowchart TB
    U[Student / Counsellor / Admin User]
    FE[React Frontend]

    subgraph Backend
        NS[Node.js Express Server]
        BD[Buddy FastAPI Service]
    end

    subgraph Data
        MG[(MongoDB)]
        CH[(ChromaDB)]
    end

    U --> FE
    FE -->|Auth, booking, forum, screening, dashboard APIs| NS
    FE -->|AI chat requests| BD

    NS -->|users, appointments, screenings, forum, auth data| MG
    BD -->|chat sessions, risk alerts, history| MG
    BD -->|knowledge retrieval| CH

    BD -->|high/critical alert| NS
    NS -->|dashboard + real-time notifications| FE
```

## Caption
Mann-Mitra uses a React frontend, a Node.js backend for institutional platform services, and a Buddy FastAPI microservice for RAG-based mental health chat and multi-signal risk detection. MongoDB stores operational and chat data, while ChromaDB stores the knowledge base embeddings used for retrieval.
