"""
Decision Engine - Routes the response based on risk level.

LOW      → supportive RAG advice, self-help, journaling
MEDIUM   → coping strategies, optional counselling recommendation
HIGH     → strongly recommend counselling, notify counsellor dashboard
CRITICAL → crisis module, grounding response, emergency helpline, admin alert

Risk assessment pipeline (runs per message):
  1. Rule-based keyword analysis (sync, ~1 ms)
  2. LLM clinical risk assessment  ← runs IN PARALLEL with RAG (adds ~0 extra latency)
  3. Semantic similarity scoring (sync, ~10 ms)
  4. Ensemble: conservative max across all available signals
"""

import asyncio
import uuid
from datetime import datetime
from typing import Optional

from app.config import settings
from app.models.schemas import (
    RiskLevel,
    RiskAssessment,
    DecisionResult,
    CounsellorRecommendation,
    CrisisResponse,
    SessionType,
    AdminAlert,
    LLMRiskSignal,
)
from app.services.rag_engine import rag_engine
from app.services.risk_detector import risk_detector
from app.services.risk_scorer import risk_scorer
from app.services.risk_llm_scorer import risk_llm_scorer
from app.services.risk_semantic_scorer import risk_semantic_scorer


COPING_EXERCISES = {
    "breathing": {
        "type": "breathing",
        "title": "4-7-8 Breathing Exercise",
        "instructions": [
            "Sit comfortably and close your eyes",
            "Breathe in through your nose for 4 counts",
            "Hold your breath for 7 counts",
            "Exhale slowly through your mouth for 8 counts",
            "Repeat 3-4 times",
        ],
        "duration": "2-3 minutes",
    },
    "grounding": {
        "type": "grounding",
        "title": "5-4-3-2-1 Grounding Technique",
        "instructions": [
            "Name 5 things you can see",
            "Name 4 things you can touch",
            "Name 3 things you can hear",
            "Name 2 things you can smell",
            "Name 1 thing you can taste",
        ],
        "duration": "3-5 minutes",
    },
    "muscle_relaxation": {
        "type": "relaxation",
        "title": "Progressive Muscle Relaxation",
        "instructions": [
            "Start with your toes — tense for 5 seconds, then relax",
            "Move up to calves, thighs, abdomen",
            "Continue with arms, shoulders, face",
            "Notice the difference between tension and relaxation",
            "Take deep breaths throughout",
        ],
        "duration": "10-15 minutes",
    },
}

CRISIS_HELPLINES = {
    "emergency": {"number": "911", "label": "Emergency Services"},
    "suicide_lifeline": {"number": "988", "label": "Suicide & Crisis Lifeline (24/7)"},
    "crisis_text": {"number": "741741", "label": "Crisis Text Line (text HOME)"},
    "india_vandrevala": {"number": "1860-2662-345", "label": "Vandrevala Foundation (India)"},
    "india_iCall": {"number": "9152987821", "label": "iCall (India)"},
}


class DecisionEngine:
    """Orchestrates RAG + multi-signal risk assessment in parallel and routes based on risk level."""

    def __init__(self):
        self._pending_alerts: list[AdminAlert] = []

    async def process_message(
        self,
        message: str,
        session_id: str,
        user_id: Optional[str] = None,
        conversation_history: list[dict] = None,
    ) -> DecisionResult:
        """
        Main entry point.
        1) Rule-based keyword extraction (sync, instant)
        2) LLM risk assessment + RAG response generation (async, parallel)
        3) Semantic similarity scoring (sync, ~10 ms)
        4) Ensemble scoring across all signals
        5) Decision routing
        """
        if conversation_history is not None:
            history = conversation_history
        else:
            history = rag_engine.get_session_messages(session_id)

        # ── Step 1: Fast rule-based analysis (used for RAG prompt hint) ──
        rule_indicators = risk_detector.analyze(message, history)
        rule_preliminary = risk_scorer._compute_rule_score(rule_indicators)
        preliminary_level = (
            "critical" if rule_preliminary >= settings.RISK_THRESHOLD_CRITICAL
            else "high" if rule_preliminary >= settings.RISK_THRESHOLD_HIGH
            else "medium" if rule_preliminary >= settings.RISK_THRESHOLD_MEDIUM
            else "low"
        )

        # ── Step 2: Parallel — LLM risk assessment + RAG generation ──
        topic_hint = self._detect_topic_hint(message)

        rag_coro = rag_engine.generate_response(
            user_message=message,
            session_id=session_id,
            risk_level=preliminary_level,
            topic_hint=topic_hint,
            prior_messages=history,
        )

        llm_signal: Optional[LLMRiskSignal] = None
        if settings.RISK_LLM_ENABLED:
            llm_coro = risk_llm_scorer.assess(message, history)
            rag_result, llm_signal = await asyncio.gather(rag_coro, llm_coro)
        else:
            rag_result = await rag_coro

        # ── Step 3: Semantic similarity (~10 ms, sync) ──
        semantic_signal = None
        if settings.RISK_SEMANTIC_ENABLED:
            semantic_signal = risk_semantic_scorer.score(message)

        # ── Step 4: Ensemble scoring ──
        risk_assessment = risk_scorer.ensemble_score(
            rule_indicators, llm_signal, semantic_signal,
        )

        # ── Step 5: Decision routing ──
        if risk_assessment.risk_level == RiskLevel.CRITICAL:
            return await self._handle_critical(
                rag_result, risk_assessment, session_id, user_id
            )
        elif risk_assessment.risk_level == RiskLevel.HIGH:
            return await self._handle_high(
                rag_result, risk_assessment, session_id, user_id
            )
        elif risk_assessment.risk_level == RiskLevel.MEDIUM:
            return self._handle_medium(rag_result, risk_assessment)
        else:
            return self._handle_low(rag_result, risk_assessment)

    # ── CRITICAL ──

    async def _handle_critical(
        self, rag_result: dict, assessment: RiskAssessment, session_id: str, user_id: Optional[str]
    ) -> DecisionResult:
        grounding = (
            "I can see you're going through something really serious right now, "
            "and I'm glad you reached out. Your feelings matter and you deserve support.\n\n"
            "**Please reach out to one of these resources right now:**\n"
            "- **Emergency:** 911\n"
            "- **Suicide & Crisis Lifeline:** 988 (call or text, 24/7)\n"
            "- **Crisis Text Line:** Text HOME to 741741\n\n"
            "You are not alone in this. A trained professional can help you through "
            "what you're feeling right now."
        )

        alert = self._create_admin_alert(assessment, session_id, user_id)
        self._pending_alerts.append(alert)

        return DecisionResult(
            risk_assessment=assessment,
            response_text=grounding,
            rag_context_used=rag_result.get("rag_context_used", False),
            rag_sources=rag_result.get("sources", []),
            suggested_actions=[
                "crisis_escalation",
                "emergency_contact",
                "immediate_help",
                "contact_counsellor",
            ],
            coping_exercise=COPING_EXERCISES["grounding"],
            counsellor_recommendation=CounsellorRecommendation(
                recommended=True,
                urgency="immediate",
                session_type=SessionType.CHAT,
                priority_tag="critical",
                message="Immediate professional support is strongly recommended.",
            ),
            crisis_response=CrisisResponse(
                is_crisis=True,
                grounding_response=grounding,
                helpline_numbers=CRISIS_HELPLINES,
                admin_alert_sent=True,
            ),
            resources={"helplines": CRISIS_HELPLINES},
        )

    # ── HIGH ──

    async def _handle_high(
        self, rag_result: dict, assessment: RiskAssessment, session_id: str, user_id: Optional[str]
    ) -> DecisionResult:
        response = rag_result["reply"]
        response += (
            "\n\n---\n"
            "**I strongly recommend speaking with a professional counselor.** "
            "They can provide the personalized support you need right now. "
            "Would you like me to help you book a priority session?"
        )

        alert = self._create_admin_alert(assessment, session_id, user_id)
        self._pending_alerts.append(alert)

        return DecisionResult(
            risk_assessment=assessment,
            response_text=response,
            rag_context_used=rag_result.get("rag_context_used", False),
            rag_sources=rag_result.get("sources", []),
            suggested_actions=[
                "book_counsellor",
                "crisis_resources",
                "breathing_exercise",
                "seek_counseling",
            ],
            coping_exercise=COPING_EXERCISES["breathing"],
            counsellor_recommendation=CounsellorRecommendation(
                recommended=True,
                urgency="high",
                session_type=SessionType.VIDEO,
                priority_tag="high",
                message="A counseling session is strongly recommended based on your current state.",
            ),
            resources={"helplines": CRISIS_HELPLINES},
        )

    # ── MEDIUM ──

    def _handle_medium(self, rag_result: dict, assessment: RiskAssessment) -> DecisionResult:
        response = rag_result["reply"]
        response += (
            "\n\nIf you'd like to talk to someone who can help further, "
            "our counselors are available. Would you like to schedule a session?"
        )

        return DecisionResult(
            risk_assessment=assessment,
            response_text=response,
            rag_context_used=rag_result.get("rag_context_used", False),
            rag_sources=rag_result.get("sources", []),
            suggested_actions=[
                "optional_counselling",
                "coping_strategies",
                "breathing_exercise",
                "journaling",
            ],
            coping_exercise=COPING_EXERCISES["muscle_relaxation"],
            counsellor_recommendation=CounsellorRecommendation(
                recommended=True,
                urgency="moderate",
                session_type=SessionType.CHAT,
                priority_tag="normal",
                message="Talking to a counselor could be helpful. Would you like to explore that option?",
            ),
        )

    # ── LOW ──

    def _handle_low(self, rag_result: dict, assessment: RiskAssessment) -> DecisionResult:
        return DecisionResult(
            risk_assessment=assessment,
            response_text=rag_result["reply"],
            rag_context_used=rag_result.get("rag_context_used", False),
            rag_sources=rag_result.get("sources", []),
            suggested_actions=[
                "self_help_resources",
                "journaling",
                "breathing_exercise",
                "mindfulness",
            ],
            coping_exercise=COPING_EXERCISES["breathing"],
        )

    # ── Admin Alerts ──

    def _create_admin_alert(
        self, assessment: RiskAssessment, session_id: str, user_id: Optional[str]
    ) -> AdminAlert:
        anon_id = f"ANON-{uuid.uuid4().hex[:8].upper()}"
        return AdminAlert(
            alert_id=f"alert_{uuid.uuid4().hex[:12]}",
            user_id=user_id,
            anonymous_id=anon_id,
            risk_level=assessment.risk_level,
            risk_score=assessment.risk_score,
            risk_summary=assessment.explanation,
            session_id=session_id,
            source="chat",
        )

    def pop_pending_alerts(self) -> list[AdminAlert]:
        alerts = list(self._pending_alerts)
        self._pending_alerts.clear()
        return alerts

    @staticmethod
    def _detect_topic_hint(message: str) -> Optional[str]:
        """Topic hints aligned with vector store metadata for better retrieval."""
        lower = message.lower()
        topics = {
            "crisis": [
                "suicide",
                "suicidal",
                "self-harm",
                "self harm",
                "kill myself",
                "killing myself",
                "end my life",
                "want to die",
                "better off dead",
                "988",
                "crisis",
            ],
            "anxiety": ["anxious", "anxiety", "worried", "nervous", "panic", "panic attack", "worried"],
            "depression": ["depressed", "depression", "sad", "hopeless", "empty", "low mood"],
            "stress": ["stress", "overwhelmed", "pressure", "burnout", "stressed"],
            "cbt": ["cbt", "cognitive", "thoughts", "behavior", "negative thinking"],
            "substance_use": ["drug", "alcohol", "substance", "addiction", "using"],
            "personality_disorders": ["personality", "borderline", "bpd", "disorder"],
            "mindfulness": ["meditation", "calm", "breathing", "relax", "grounding", "mindful"],
            "self_care": ["sleep", "exercise", "nutrition", "self-care", "routine", "wellness"],
            "relationships": ["lonely", "alone", "isolated", "relationship", "friends", "social"],
            "mental_health_general": ["mental health", "therapy", "counseling", "wellbeing"],
        }
        for topic, keywords in topics.items():
            if any(k in lower for k in keywords):
                return topic
        return None


decision_engine = DecisionEngine()
