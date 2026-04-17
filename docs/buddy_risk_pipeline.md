# Buddy Risk Pipeline Diagram

```mermaid
flowchart LR
    M[User Message] --> R1[Rule-Based Risk Detector]
    M --> R2[LLM Clinical Risk Scorer]
    M --> R3[Semantic Similarity Scorer]

    R1 --> E[Ensemble Risk Scorer]
    R2 --> E
    R3 --> E

    E --> D{Risk Level}

    D -->|Low| L[Supportive RAG Response]
    D -->|Medium| M1[Coping Exercise + Optional Counselling]
    D -->|High| H[Strong Counselling Recommendation + Alert]
    D -->|Critical| C[Crisis Response + Helplines + Immediate Alert]
```

## Caption
Buddy evaluates each message using three independent signals and combines them using a conservative max ensemble. This design prioritizes safety by ensuring that any strong crisis signal can trigger intervention.
