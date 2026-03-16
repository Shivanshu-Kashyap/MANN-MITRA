"""
Risk Detector - NLP-based detection of self-harm, suicidal ideation,
severe anxiety, and panic states from user messages.

Runs in PARALLEL with the RAG pipeline on every user message.
"""

import re
from app.models.schemas import RiskIndicators


# ── Keyword Dictionaries with Weights ──

CRITICAL_KEYWORDS = {
    "kill myself": 95,
    "end my life": 95,
    "suicide": 90,
    "suicidal": 90,
    "want to die": 90,
    "better off dead": 90,
    "no point living": 85,
    "ending it all": 90,
    "overdose": 85,
    "hang myself": 95,
    "cut myself": 80,
    "jump off": 85,
    "slit my wrists": 95,
    "take my life": 95,
    "not worth living": 85,
    "no reason to live": 85,
    "self harm": 75,
    "hurt myself": 75,
    "plan to die": 95,
    "goodbye letter": 90,
    "final note": 85,
}

HIGH_KEYWORDS = {
    "hopeless": 60,
    "worthless": 55,
    "no way out": 65,
    "can't go on": 65,
    "trapped": 50,
    "burden to everyone": 65,
    "nobody cares": 55,
    "nothing matters": 55,
    "give up": 50,
    "hate myself": 55,
    "empty inside": 50,
    "severe depression": 60,
    "can't take it anymore": 65,
    "breaking point": 55,
    "falling apart": 50,
    "no escape": 60,
    "wish i wasn't here": 70,
    "disappear": 45,
}

MEDIUM_KEYWORDS = {
    "depressed": 35,
    "anxious": 30,
    "panic attack": 40,
    "can't cope": 40,
    "overwhelmed": 30,
    "scared": 25,
    "alone": 25,
    "isolated": 30,
    "crying": 25,
    "can't sleep": 30,
    "can't eat": 30,
    "nightmares": 30,
    "flashback": 35,
    "trauma": 35,
    "cutting": 50,
    "drinking too much": 35,
    "using drugs": 40,
    "panic": 35,
    "can't breathe": 35,
    "shaking": 25,
    "heart racing": 30,
}

LOW_KEYWORDS = {
    "stressed": 10,
    "tired": 10,
    "worried": 10,
    "sad": 15,
    "confused": 10,
    "uncertain": 10,
    "frustrated": 15,
    "angry": 15,
    "nervous": 15,
    "down": 15,
    "unhappy": 15,
    "struggling": 15,
    "difficult": 10,
    "tough time": 10,
}

# Emotional intensity amplifiers
INTENSITY_MARKERS = {
    "very": 1.2,
    "extremely": 1.4,
    "really": 1.15,
    "so much": 1.3,
    "unbearable": 1.5,
    "terrible": 1.3,
    "horrible": 1.3,
    "worst": 1.3,
    "always": 1.2,
    "never": 1.2,
    "every day": 1.2,
    "constantly": 1.3,
    "can't stop": 1.3,
    "all the time": 1.2,
}


class RiskDetector:
    """Detects risk indicators in user messages using keyword analysis and NLP heuristics."""

    def analyze(self, message: str, conversation_history: list[dict] = None) -> RiskIndicators:
        lower = message.lower().strip()
        lower = re.sub(r"[^\w\s']", " ", lower)

        keyword_flags = []
        max_score = 0

        self_harm_score = 0.0
        suicidal_score = 0.0
        anxiety_score = 0.0
        panic_score = 0.0

        # Scan critical keywords
        for kw, weight in CRITICAL_KEYWORDS.items():
            if kw in lower:
                keyword_flags.append(kw)
                max_score = max(max_score, weight)
                if any(w in kw for w in ("suicide", "suicidal", "die", "life", "kill", "dead", "living")):
                    suicidal_score = max(suicidal_score, weight / 100.0)
                if any(w in kw for w in ("harm", "hurt", "cut", "overdose", "slit")):
                    self_harm_score = max(self_harm_score, weight / 100.0)

        # Scan high keywords
        for kw, weight in HIGH_KEYWORDS.items():
            if kw in lower:
                keyword_flags.append(kw)
                max_score = max(max_score, weight)
                suicidal_score = max(suicidal_score, weight / 100.0 * 0.7)

        # Scan medium keywords
        for kw, weight in MEDIUM_KEYWORDS.items():
            if kw in lower:
                keyword_flags.append(kw)
                max_score = max(max_score, weight)
                if any(w in kw for w in ("panic", "breathe", "shaking", "racing")):
                    panic_score = max(panic_score, weight / 100.0)
                if any(w in kw for w in ("anxious", "scared", "nervous")):
                    anxiety_score = max(anxiety_score, weight / 100.0)

        # Scan low keywords
        for kw, weight in LOW_KEYWORDS.items():
            if kw in lower:
                keyword_flags.append(kw)
                max_score = max(max_score, weight)

        # Emotional intensity multiplier
        intensity = 1.0
        for marker, mult in INTENSITY_MARKERS.items():
            if marker in lower:
                intensity = max(intensity, mult)

        # Repetition factor from conversation history
        repetition = 0.0
        if conversation_history:
            recent_messages = [
                m["content"].lower()
                for m in conversation_history[-6:]
                if m.get("role") == "user"
            ]
            flag_set = set(keyword_flags)
            repeat_count = 0
            for prev in recent_messages:
                for kw in flag_set:
                    if kw in prev:
                        repeat_count += 1
                        break
            if recent_messages:
                repetition = min(repeat_count / max(len(recent_messages), 1), 1.0)

        # Historical trend from recent risk patterns
        historical = 0.0
        if conversation_history:
            recent_user_msgs = [
                m["content"].lower()
                for m in conversation_history[-10:]
                if m.get("role") == "user"
            ]
            neg_count = sum(
                1 for m in recent_user_msgs
                if any(kw in m for kw in list(HIGH_KEYWORDS.keys())[:8])
            )
            if recent_user_msgs:
                historical = min(neg_count / max(len(recent_user_msgs), 1), 1.0)

        return RiskIndicators(
            self_harm_score=round(min(self_harm_score * intensity, 1.0), 3),
            suicidal_ideation_score=round(min(suicidal_score * intensity, 1.0), 3),
            severe_anxiety_score=round(min(anxiety_score * intensity, 1.0), 3),
            panic_state_score=round(min(panic_score * intensity, 1.0), 3),
            emotional_intensity=round(min(intensity / 1.5, 1.0), 3),
            keyword_flags=list(set(keyword_flags)),
            repetition_factor=round(repetition, 3),
            historical_trend=round(historical, 3),
        )


risk_detector = RiskDetector()
