"""
Buddy RAG Service - FastAPI entry point.
Mental health chatbot with RAG + Risk Detection + Decision Engine.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.routes import router
from app.services.vector_store import vector_store
from app.services.session_store import session_store
from app.services.risk_semantic_scorer import risk_semantic_scorer
from app.services.risk_detector import RiskDetector


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──
    print("=" * 60)
    print("  Buddy RAG Service Starting...")
    print("=" * 60)

    vector_store.initialize()
    await session_store.connect()

    if settings.RISK_SEMANTIC_ENABLED:
        risk_semantic_scorer.initialize()

    if settings.RISK_CALIBRATE_WEIGHTS:
        RiskDetector.calibrate()

    print(f"  Gemini configured:    {settings.has_gemini}")
    print(f"  OpenRouter configured: {settings.has_openrouter} ({settings.OPENROUTER_MODEL})")
    print(f"  Risk LLM enabled:     {settings.RISK_LLM_ENABLED}")
    print(f"  Risk Semantic enabled: {settings.RISK_SEMANTIC_ENABLED}")
    print(f"  Vector DB docs:    {vector_store.get_stats()['total_documents']}")
    print(f"  Node.js server:    {settings.NODE_SERVER_URL}")
    print("=" * 60)

    yield

    # ── Shutdown ──
    await session_store.close()
    print("Buddy RAG Service stopped.")


app = FastAPI(
    title="Buddy - RAG Mental Health Chatbot",
    description=(
        "RAG-based mental health first-aid chatbot with risk detection, "
        "counsellor recommendations, and admin alerts for the Mann-Mitra platform."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        settings.NODE_SERVER_URL,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
