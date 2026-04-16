"""
API Routes - All FastAPI endpoints for the Buddy RAG service.
"""

import uuid
import httpx
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, Query

from app.config import settings
from app.models.schemas import (
    ChatRequest,
    ChatResponse,
    IngestTextRequest,
    IngestResponse,
    HealthResponse,
    RiskLevel,
    AdminAlert,
    RiskDashboardEntry,
)
from app.services.decision_engine import decision_engine
from app.services.document_loader import document_loader
from app.services.vector_store import vector_store
from app.services.session_store import session_store
from app.services.rag_engine import rag_engine

router = APIRouter()


async def _conversation_history_for_session(session_id: str) -> list[dict]:
    """Prefer MongoDB transcript so RAG/risk survive restarts; fall back to in-process memory."""
    if settings.MONGO_URI:
        try:
            stored = await session_store.get_chat_history_turns(session_id)
            if stored:
                return stored
        except Exception as e:
            print(f"[Chat] Could not load session history: {e}")
    return rag_engine.get_session_messages(session_id)


# ━━━━━━━━━━━━━━━━━━━━ Health ━━━━━━━━━━━━━━━━━━━━

@router.get("/health", response_model=HealthResponse)
async def health_check():
    vs_stats = vector_store.get_stats()
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        services={
            "vector_store": vs_stats,
            "gemini_configured": settings.has_gemini,
            "openrouter_configured": settings.has_openrouter,
            "mongodb_configured": bool(settings.MONGO_URI),
        },
    )


# ━━━━━━━━━━━━━━━━━━━━ Chat ━━━━━━━━━━━━━━━━━━━━

@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """
    Main chat endpoint. Runs RAG + Risk Detection in parallel,
    applies decision engine, persists to MongoDB, and triggers alerts.
    """
    session_id = req.session_id or f"session_{uuid.uuid4().hex[:12]}"

    history = await _conversation_history_for_session(session_id)
    result = await decision_engine.process_message(
        message=req.message,
        session_id=session_id,
        user_id=req.user_id,
        conversation_history=history,
    )

    # Persist interaction to MongoDB
    try:
        await session_store.save_interaction(
            session_id=session_id,
            user_message=req.message,
            bot_reply=result.response_text,
            risk_score=result.risk_assessment.risk_score,
            risk_level=result.risk_assessment.risk_level.value,
            risk_summary=result.risk_assessment.explanation,
            user_id=req.user_id,
            user_name=req.user_name,
        )
    except Exception as e:
        print(f"[Chat] MongoDB save error: {e}")

    # Send admin alerts for high/critical risk
    alerts = decision_engine.pop_pending_alerts()
    for alert in alerts:
        try:
            await _send_alert_to_node_server(alert)
            await session_store.save_alert(alert.model_dump())
        except Exception as e:
            print(f"[Chat] Alert send error: {e}")

    return ChatResponse(
        success=True,
        session_id=session_id,
        reply=result.response_text,
        risk_level=result.risk_assessment.risk_level,
        risk_score=result.risk_assessment.risk_score,
        suggested_actions=result.suggested_actions,
        counsellor_recommendation=result.counsellor_recommendation,
        crisis_response=result.crisis_response,
        coping_exercise=result.coping_exercise,
        resources=result.resources,
        rag_sources=result.rag_sources,
    )


@router.post("/chat/text")
async def chat_text(req: ChatRequest):
    """Simplified text-only endpoint matching existing Buddy agent interface."""
    session_id = req.session_id or f"text_session_{uuid.uuid4().hex[:8]}"

    history = await _conversation_history_for_session(session_id)
    result = await decision_engine.process_message(
        message=req.message,
        session_id=session_id,
        user_id=req.user_id,
        conversation_history=history,
    )

    try:
        await session_store.save_interaction(
            session_id=session_id,
            user_message=req.message,
            bot_reply=result.response_text,
            risk_score=result.risk_assessment.risk_score,
            risk_level=result.risk_assessment.risk_level.value,
            risk_summary=result.risk_assessment.explanation,
            user_id=req.user_id,
            user_name=req.user_name,
        )
    except Exception as e:
        print(f"[ChatText] MongoDB save error: {e}")

    alerts = decision_engine.pop_pending_alerts()
    for alert in alerts:
        try:
            await _send_alert_to_node_server(alert)
            await session_store.save_alert(alert.model_dump())
        except Exception as e:
            print(f"[ChatText] Alert error: {e}")

    return {
        "text": result.response_text,
        "session_id": session_id,
        "risk_level": result.risk_assessment.risk_level.value,
        "risk_score": result.risk_assessment.risk_score,
        "suggested_actions": result.suggested_actions,
        "counsellor_recommendation": (
            result.counsellor_recommendation.model_dump()
            if result.counsellor_recommendation else None
        ),
        "crisis_response": (
            result.crisis_response.model_dump()
            if result.crisis_response else None
        ),
        "coping_exercise": result.coping_exercise,
    }


@router.get("/chat/history/{session_id}")
async def get_chat_history(session_id: str):
    session = await session_store.get_session(session_id)
    if not session:
        return {"success": True, "session_id": session_id, "messages": [], "risk_score": 0}
    return {
        "success": True,
        "session_id": session_id,
        "messages": session.get("messages", []),
        "risk_score": session.get("risk_score", 0),
        "risk_level": session.get("risk_level", "low"),
        "mood_scores": session.get("mood_scores", []),
        "interaction_count": session.get("interaction_count", 0),
    }


@router.delete("/chat/sessions/{session_id}")
async def clear_session(session_id: str):
    rag_engine.clear_session(session_id)
    return {"success": True, "message": f"Session {session_id} cleared"}


# ━━━━━━━━━━━━━━━━━━━━ Knowledge Base Ingestion ━━━━━━━━━━━━━━━━━━━━

@router.post("/ingest/text", response_model=IngestResponse)
async def ingest_text(req: IngestTextRequest):
    """Ingest a text document into the knowledge base."""
    metadata = {
        "title": req.title,
        "category": req.category,
        "severity_tags": req.severity_tags,
        "ingested_at": datetime.utcnow().isoformat(),
    }
    docs = document_loader.load_text(req.content, source=req.title, metadata=metadata)
    count = vector_store.add_documents(docs)
    return IngestResponse(
        success=True,
        documents_processed=1,
        chunks_created=count,
        message=f"Ingested '{req.title}' as {count} chunks",
    )


@router.post("/ingest/pdf", response_model=IngestResponse)
async def ingest_pdf(file: UploadFile = File(...), category: str = "general"):
    """Upload and ingest a PDF file."""
    import tempfile, os

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are supported")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        metadata = {
            "original_filename": file.filename,
            "category": category,
            "ingested_at": datetime.utcnow().isoformat(),
        }
        docs = document_loader.load_pdf(tmp_path, metadata=metadata)
        count = vector_store.add_documents(docs)
        return IngestResponse(
            success=True,
            documents_processed=1,
            chunks_created=count,
            message=f"Ingested '{file.filename}' as {count} chunks",
        )
    finally:
        os.unlink(tmp_path)


@router.post("/ingest/directory", response_model=IngestResponse)
async def ingest_directory(dir_path: str):
    """Ingest all PDFs and text files from a local directory."""
    import os

    if not os.path.isdir(dir_path):
        raise HTTPException(400, f"Directory not found: {dir_path}")

    docs = document_loader.load_directory(dir_path)
    count = vector_store.add_documents(docs)
    return IngestResponse(
        success=True,
        documents_processed=len(set(d["metadata"]["source"] for d in docs)) if docs else 0,
        chunks_created=count,
        message=f"Ingested {count} chunks from {dir_path}",
    )


@router.get("/knowledge-base/stats")
async def kb_stats():
    return vector_store.get_stats()


@router.post("/knowledge-base/search")
async def kb_search(
    query: str,
    n_results: int = Query(default=5, ge=1, le=20),
    topic: Optional[str] = None,
):
    results = vector_store.query(query, n_results=n_results, topic_filter=topic)
    return {"results": results, "count": len(results)}


# ━━━━━━━━━━━━━━━━━━━━ Admin / Risk Dashboard ━━━━━━━━━━━━━━━━━━━━

@router.get("/admin/risk-dashboard")
async def risk_dashboard():
    """Dashboard data for admin: high-risk sessions, alerts, stats."""
    high_risk = await session_store.get_high_risk_sessions(limit=30)
    recent_alerts = await session_store.get_recent_alerts(limit=30)
    stats = await session_store.get_risk_stats()

    dashboard_entries = []
    for s in high_risk:
        stored_name = s.get("user_name") or None
        anon_id = f"ANON-{s.get('session_id', '')[:8].upper()}"
        display = stored_name if stored_name else anon_id

        dashboard_entries.append(
            RiskDashboardEntry(
                session_id=s.get("session_id", ""),
                anonymous_id=anon_id,
                user_name=stored_name,
                display_name=display,
                risk_level=RiskLevel(s.get("risk_level", "low")),
                risk_score=s.get("risk_score", 0),
                risk_summary=s.get("risk_summary", ""),
                interaction_count=s.get("interaction_count", 0),
                mood_trend=s.get("mood_scores", [])[-10:],
                last_active=s.get("updated_at", datetime.utcnow()),
            ).model_dump()
        )

    return {
        "success": True,
        "high_risk_cases": dashboard_entries,
        "recent_alerts": recent_alerts,
        "severity_distribution": stats,
        "generated_at": datetime.utcnow().isoformat(),
    }


@router.get("/admin/alerts")
async def get_alerts(limit: int = Query(default=50, ge=1, le=200)):
    alerts = await session_store.get_recent_alerts(limit)
    return {"success": True, "alerts": alerts, "count": len(alerts)}


@router.get("/admin/risk-sessions")
async def get_risk_sessions(
    limit: int = Query(default=200, ge=1, le=1000),
    include_messages: bool = Query(default=True),
):
    """Return all chat sessions for admin review with optional full transcript."""
    sessions = await session_store.get_admin_sessions(
        limit=limit,
        include_messages=include_messages,
    )

    normalized_sessions = []
    for s in sessions:
        session_id = s.get("session_id", "")
        stored_name = s.get("user_name") or None
        anon_id = f"ANON-{session_id[:8].upper()}" if session_id else "ANON-UNKNOWN"
        display = stored_name if stored_name else anon_id

        messages = []
        if include_messages:
            for m in s.get("messages", []):
                messages.append(
                    {
                        "role": m.get("role", "assistant"),
                        "content": m.get("content", ""),
                        "risk_score": m.get("risk_score", 0),
                        "timestamp": m.get("timestamp"),
                    }
                )

        normalized_sessions.append(
            {
                "session_id": session_id,
                "anonymous_id": anon_id,
                "user_id": s.get("user_id"),
                "user_name": stored_name,
                "display_name": display,
                "risk_level": s.get("risk_level", "low"),
                "risk_score": s.get("risk_score", 0),
                "risk_summary": s.get("risk_summary", ""),
                "interaction_count": s.get("interaction_count", 0),
                "mood_scores": s.get("mood_scores", []),
                "created_at": s.get("created_at"),
                "updated_at": s.get("updated_at"),
                "messages": messages,
            }
        )

    return {
        "success": True,
        "count": len(normalized_sessions),
        "sessions": normalized_sessions,
        "generated_at": datetime.utcnow().isoformat(),
    }


# ━━━━━━━━━━━━━━━━━━━━ Node.js Server Integration ━━━━━━━━━━━━━━━━━━━━

async def _send_alert_to_node_server(alert: AdminAlert):
    """Forward critical/high risk alerts to the Node.js server for Socket.io broadcasting."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            payload = {
                "alertId": alert.alert_id,
                "userId": alert.user_id,
                "anonymousId": alert.anonymous_id,
                "riskLevel": alert.risk_level.value,
                "riskScore": alert.risk_score,
                "riskSummary": alert.risk_summary,
                "source": "buddy_rag",
                "sessionId": alert.session_id,
                "timestamp": alert.timestamp.isoformat(),
            }
            resp = await client.post(
                f"{settings.NODE_SERVER_URL}/api/v1/chat/buddy-alert",
                json=payload,
            )
            if resp.status_code == 200:
                print(f"[Alert] Sent to Node.js server: {alert.alert_id}")
            else:
                print(f"[Alert] Node.js server responded {resp.status_code}")
    except Exception as e:
        print(f"[Alert] Failed to reach Node.js server: {e}")
