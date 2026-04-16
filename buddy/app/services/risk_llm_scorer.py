"""
LLM-based Risk Assessment — uses the language model as a clinical risk triage system.

Why this works better than fixed weights:
  - LLM understands context, sarcasm, metaphors, and implicit suicidal ideation
    (e.g. "I just want the pain to stop" → HIGH, "gonna kill it at the exam" → LOW)
  - Handles bilingual English/Hindi/Hinglish natively
  - Clinical knowledge baked into pre-training — no labeled data needed
  - temperature=0 for deterministic, consistent assessments

Runs IN PARALLEL with RAG generation so it adds ~0 extra latency.
Falls back gracefully: if the LLM call fails, ensemble uses rule-based + semantic only.
"""

import json
from typing import Optional

import httpx

from app.config import settings
from app.models.schemas import LLMRiskSignal

_SYSTEM_PROMPT = (
    "You are a mental health risk triage system for a college support platform.\n"
    "Analyze the user's latest message (and conversation history when provided) "
    "for psychological risk signals.\n\n"
    "Rate each dimension from 0.0 (absent) to 1.0 (extreme):\n"
    "- suicidal_ideation: passive or active desire for death, disappearance, or not wanting to live\n"
    "- self_harm_risk: non-suicidal or suicidal urge to physically injure oneself\n"
    "- suicidal_intent: desire or readiness to act on suicidal thoughts\n"
    "- suicide_plan: planning, timing, method selection, goodbye behavior, rehearsal, preparation\n"
    "- access_to_means: access to pills, blades, rope, heights, weapons, poison, or other lethal means\n"
    "- recent_self_harm: recent self-injury, suicide attempt, rehearsal, or aborted attempt\n"
    "- crisis_severity: immediate danger or acute psychological emergency\n"
    "- emotional_distress: overall emotional pain and suffering level\n"
    "- hopelessness: feeling trapped, no future, giving up, burden to others\n\n"
    "- burdensomeness: belief that others are better off without them or they are a burden\n"
    "- isolation_withdrawal: social withdrawal, saying goodbye, cutting off contact, feeling alone\n"
    "- impulsivity: unstable, agitated, reckless, or likely to act suddenly\n"
    "- substance_use_risk: alcohol or drug use that could increase self-harm or suicide risk\n\n"
    "Also provide:\n"
    "- overall_risk: one of \"low\", \"medium\", \"high\", \"critical\"\n"
    "- confidence: your assessment confidence 0.0-1.0\n"
    "- concerns: list of specific concerns detected (short strings)\n\n"
    "SAFETY RULES:\n"
    "- When uncertain, err toward HIGHER risk (false negatives are dangerous)\n"
    "- Implicit ideation counts (e.g. 'nobody would care if I disappeared')\n"
    "- Consider escalating distress patterns across conversation history\n"
    "- Distinguish passive ideation, suicidal intent, concrete planning, and non-suicidal self-harm\n"
    "- Planning plus access to means should strongly increase risk\n"
    "- Recent attempt, rehearsal, or self-harm should strongly increase risk\n"
    "- The user may write in Hindi or Hinglish\n\n"
    "Respond with ONLY valid JSON (no markdown fences, no commentary):\n"
    '{"suicidal_ideation":0.0,"self_harm_risk":0.0,"suicidal_intent":0.0,'
    '"suicide_plan":0.0,"access_to_means":0.0,"recent_self_harm":0.0,'
    '"crisis_severity":0.0,"emotional_distress":0.0,"hopelessness":0.0,'
    '"burdensomeness":0.0,"isolation_withdrawal":0.0,"impulsivity":0.0,'
    '"substance_use_risk":0.0,"overall_risk":"low",'
    '"confidence":0.0,"concerns":[]}'
)

_UNAVAILABLE = LLMRiskSignal(available=False)


def _clamp(v, lo: float = 0.0, hi: float = 1.0) -> float:
    try:
        return max(lo, min(float(v), hi))
    except (TypeError, ValueError):
        return 0.0


def _build_user_content(message: str, history: Optional[list[dict]]) -> str:
    parts: list[str] = []
    if history:
        parts.append("CONVERSATION HISTORY (recent turns):")
        for m in history[-6:]:
            role = (m.get("role") or "user").upper()
            text = (m.get("content") or "")[:300]
            parts.append(f"  {role}: {text}")
        parts.append("")
    parts.append(f"LATEST USER MESSAGE:\n{message}")
    return "\n".join(parts)


def _parse_llm_json(text: str) -> LLMRiskSignal:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[-1]
    if text.endswith("```"):
        text = text[: text.rfind("```")]
    text = text.strip()

    data = json.loads(text)
    return LLMRiskSignal(
        suicidal_ideation=_clamp(data.get("suicidal_ideation", 0)),
        self_harm_risk=_clamp(data.get("self_harm_risk", 0)),
        suicidal_intent=_clamp(data.get("suicidal_intent", 0)),
        suicide_plan=_clamp(data.get("suicide_plan", 0)),
        access_to_means=_clamp(data.get("access_to_means", 0)),
        recent_self_harm=_clamp(data.get("recent_self_harm", 0)),
        crisis_severity=_clamp(data.get("crisis_severity", 0)),
        emotional_distress=_clamp(data.get("emotional_distress", 0)),
        hopelessness=_clamp(data.get("hopelessness", 0)),
        burdensomeness=_clamp(data.get("burdensomeness", 0)),
        isolation_withdrawal=_clamp(data.get("isolation_withdrawal", 0)),
        impulsivity=_clamp(data.get("impulsivity", 0)),
        substance_use_risk=_clamp(data.get("substance_use_risk", 0)),
        overall_risk=str(data.get("overall_risk", "low")).lower(),
        confidence=_clamp(data.get("confidence", 0.5)),
        concerns=list(data.get("concerns") or []),
    )


class RiskLLMScorer:
    """Calls Gemini (primary) or OpenRouter (fallback) for structured risk assessment."""

    async def assess(
        self,
        message: str,
        conversation_history: Optional[list[dict]] = None,
    ) -> LLMRiskSignal:
        if not settings.RISK_LLM_ENABLED:
            return _UNAVAILABLE
        if not (settings.has_gemini or settings.has_openrouter):
            return _UNAVAILABLE

        if settings.has_gemini:
            try:
                return await self._assess_gemini(message, conversation_history)
            except Exception as exc:
                print(f"[RiskLLMScorer] Gemini failed: {exc}")

        if settings.has_openrouter:
            try:
                return await self._assess_openrouter(message, conversation_history)
            except Exception as exc:
                print(f"[RiskLLMScorer] OpenRouter failed: {exc}")

        return _UNAVAILABLE

    async def _assess_gemini(
        self, message: str, history: Optional[list[dict]]
    ) -> LLMRiskSignal:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        user_content = _build_user_content(message, history)

        response = await client.aio.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=[
                types.Content(
                    role="user",
                    parts=[types.Part.from_text(text=user_content)],
                )
            ],
            config=types.GenerateContentConfig(
                system_instruction=_SYSTEM_PROMPT,
                max_output_tokens=300,
                temperature=0.0,
            ),
        )
        return _parse_llm_json(response.text or "")

    async def _assess_openrouter(
        self, message: str, history: Optional[list[dict]]
    ) -> LLMRiskSignal:
        user_content = _build_user_content(message, history)
        url = settings.openrouter_chat_completions_url()

        headers: dict[str, str] = {
            "Authorization": f"Bearer {settings.OPENROUTER_API_KEY.strip()}",
            "Content-Type": "application/json",
        }
        ref = (settings.OPENROUTER_HTTP_REFERER or "").strip()
        if ref:
            headers["Referer"] = ref
        title = (settings.OPENROUTER_APP_TITLE or "").strip()
        if title:
            headers["X-Title"] = title

        payload = {
            "model": settings.OPENROUTER_MODEL,
            "messages": [
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
            ],
            "temperature": 0.0,
            "max_tokens": 300,
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()

        choice = (data.get("choices") or [{}])[0]
        msg = choice.get("message") or {}
        text = (msg.get("content") or "").strip()
        return _parse_llm_json(text)


risk_llm_scorer = RiskLLMScorer()
