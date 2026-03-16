"""
Risk Scorer - Computes a 0-100 risk score and assigns a risk level
using weighted combination of risk indicators.

Formula:
  Risk Score = (Emotion Intensity x W1)
             + (Self-Harm Probability x W2)
             + (Suicidal Ideation x W3)
             + (Anxiety/Panic x W4)
             + (Repetition Factor x W5)
             + (Historical Trend x W6)
"""

from app.config import settings
from app.models.schemas import RiskIndicators, RiskAssessment, RiskLevel

# Weights (must sum to 1.0)
W_EMOTION = 0.10
W_SELF_HARM = 0.25
W_SUICIDAL = 0.30
W_ANXIETY_PANIC = 0.10
W_REPETITION = 0.10
W_HISTORICAL = 0.15


class RiskScorer:

    def score(self, indicators: RiskIndicators) -> RiskAssessment:
        raw = (
            indicators.emotional_intensity * W_EMOTION
            + indicators.self_harm_score * W_SELF_HARM
            + indicators.suicidal_ideation_score * W_SUICIDAL
            + max(indicators.severe_anxiety_score, indicators.panic_state_score) * W_ANXIETY_PANIC
            + indicators.repetition_factor * W_REPETITION
            + indicators.historical_trend * W_HISTORICAL
        )

        # Scale 0-1 float -> 0-100 int
        score = int(min(round(raw * 100), 100))

        # Hard override: if ANY critical-level keyword was flagged, floor the score
        _CRITICAL_OVERRIDE_TOKENS = {
            "suicide", "suicidal", "sucidal", "sucidial", "sucidle", "suicde",
            "kill", "die", "dead", "end my life", "overdose", "unalive",
            "kms", "kys", "ctb",
            "marna", "mar jana", "mar jaana", "jaan de", "khudkushi",
            "aatmhatya", "atmahatya", "kud ja", "kood ja", "zinda nahi",
            "maut", "fansi", "phansi",
        }
        joined_flags = " ".join(indicators.keyword_flags).lower()
        has_critical = any(tok in joined_flags for tok in _CRITICAL_OVERRIDE_TOKENS)

        if has_critical and score < settings.RISK_THRESHOLD_CRITICAL:
            score = settings.RISK_THRESHOLD_CRITICAL

        # If suicidal ideation score is very high, ensure at least HIGH
        if indicators.suicidal_ideation_score >= 0.7 and score < settings.RISK_THRESHOLD_HIGH:
            score = settings.RISK_THRESHOLD_HIGH

        level = self._classify(score)
        explanation = self._explain(indicators, score, level)

        return RiskAssessment(
            risk_score=score,
            risk_level=level,
            indicators=indicators,
            explanation=explanation,
            requires_immediate_action=level in (RiskLevel.HIGH, RiskLevel.CRITICAL),
        )

    def _classify(self, score: int) -> RiskLevel:
        if score >= settings.RISK_THRESHOLD_CRITICAL:
            return RiskLevel.CRITICAL
        if score >= settings.RISK_THRESHOLD_HIGH:
            return RiskLevel.HIGH
        if score >= settings.RISK_THRESHOLD_MEDIUM:
            return RiskLevel.MEDIUM
        return RiskLevel.LOW

    @staticmethod
    def _explain(indicators: RiskIndicators, score: int, level: RiskLevel) -> str:
        parts = []

        if indicators.suicidal_ideation_score > 0.5:
            parts.append("suicidal ideation detected")
        if indicators.self_harm_score > 0.5:
            parts.append("self-harm intent detected")
        if indicators.panic_state_score > 0.3:
            parts.append("possible panic state")
        if indicators.severe_anxiety_score > 0.3:
            parts.append("elevated anxiety")
        if indicators.emotional_intensity > 0.6:
            parts.append("high emotional intensity")
        if indicators.repetition_factor > 0.4:
            parts.append("recurring distress patterns across messages")
        if indicators.historical_trend > 0.4:
            parts.append("worsening mood trend in conversation history")

        if indicators.keyword_flags:
            top_flags = indicators.keyword_flags[:5]
            parts.append(f"flagged keywords: {', '.join(top_flags)}")

        if not parts:
            parts.append("no significant risk indicators detected")

        summary = "; ".join(parts)
        return f"Risk score {score}/100 ({level.value}). {summary.capitalize()}."


risk_scorer = RiskScorer()
