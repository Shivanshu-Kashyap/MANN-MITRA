from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
from datetime import datetime


# ── Risk Level Enum ──

class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class SessionType(str, Enum):
    CHAT = "chat"
    VIDEO = "video"
    OFFLINE = "offline"


# ── Request Models ──

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=3000)
    session_id: str = Field(default="")
    user_id: Optional[str] = None
    language: str = "en"


class IngestRequest(BaseModel):
    file_path: Optional[str] = None
    text: Optional[str] = None
    metadata: dict = Field(default_factory=dict)


class IngestTextRequest(BaseModel):
    title: str
    content: str
    category: str = "general"
    severity_tags: list[str] = Field(default_factory=list)


# ── Risk Models ──

class RiskIndicators(BaseModel):
    self_harm_score: float = 0.0
    suicidal_ideation_score: float = 0.0
    severe_anxiety_score: float = 0.0
    panic_state_score: float = 0.0
    emotional_intensity: float = 0.0
    keyword_flags: list[str] = Field(default_factory=list)
    repetition_factor: float = 0.0
    historical_trend: float = 0.0


class RiskAssessment(BaseModel):
    risk_score: int = Field(ge=0, le=100)
    risk_level: RiskLevel
    indicators: RiskIndicators
    explanation: str = ""
    requires_immediate_action: bool = False
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ── Decision Engine Models ──

class CounsellorRecommendation(BaseModel):
    recommended: bool = False
    urgency: str = "none"
    session_type: Optional[SessionType] = None
    priority_tag: str = "normal"
    message: str = ""


class CrisisResponse(BaseModel):
    is_crisis: bool = False
    grounding_response: str = ""
    helpline_numbers: dict = Field(default_factory=dict)
    admin_alert_sent: bool = False


class DecisionResult(BaseModel):
    risk_assessment: RiskAssessment
    response_text: str
    rag_context_used: bool = False
    rag_sources: list[str] = Field(default_factory=list)
    suggested_actions: list[str] = Field(default_factory=list)
    coping_exercise: Optional[dict] = None
    counsellor_recommendation: CounsellorRecommendation = Field(
        default_factory=CounsellorRecommendation
    )
    crisis_response: Optional[CrisisResponse] = None
    resources: dict = Field(default_factory=dict)


# ── Chat Response ──

class ChatResponse(BaseModel):
    success: bool = True
    session_id: str
    reply: str
    risk_level: RiskLevel = RiskLevel.LOW
    risk_score: int = 0
    suggested_actions: list[str] = Field(default_factory=list)
    counsellor_recommendation: Optional[CounsellorRecommendation] = None
    crisis_response: Optional[CrisisResponse] = None
    coping_exercise: Optional[dict] = None
    resources: dict = Field(default_factory=dict)
    rag_sources: list[str] = Field(default_factory=list)
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ── Admin Models ──

class AdminAlert(BaseModel):
    alert_id: str
    user_id: Optional[str] = None
    anonymous_id: str
    risk_level: RiskLevel
    risk_score: int
    risk_summary: str
    source: str = "chat"
    session_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    requires_action: bool = True


class RiskDashboardEntry(BaseModel):
    session_id: str
    anonymous_id: str
    risk_level: RiskLevel
    risk_score: int
    risk_summary: str
    interaction_count: int = 0
    mood_trend: list[int] = Field(default_factory=list)
    last_active: datetime = Field(default_factory=datetime.utcnow)


class IngestResponse(BaseModel):
    success: bool
    documents_processed: int = 0
    chunks_created: int = 0
    message: str = ""


class HealthResponse(BaseModel):
    status: str = "healthy"
    version: str = "1.0.0"
    services: dict = Field(default_factory=dict)
