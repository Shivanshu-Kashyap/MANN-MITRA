"""
Risk Scorer — Multi-signal ensemble that replaces fixed-weight heuristics.

Previous approach (removed):
  risk = suicidal*0.30 + self_harm*0.25 + anxiety*0.10 + ...
  ↑ arbitrary weights, no clinical basis, dilutes severe signals

New approach (conservative-max ensemble):
  Signal 1  Rule-based keyword analysis      → rule_score   (always available)
  Signal 2  LLM clinical risk assessment     → llm_score    (when API is up)
  Signal 3  Semantic similarity to crisis ref → semantic_score (when model loaded)
  ─────────────────────────────────────────────────────────
  final_score = max(rule_score, llm_score, semantic_score)

Why max (not mean)?  In mental health, a false negative (missing a suicidal user)
is far more dangerous than a false positive.  If ANY signal screams HIGH, we act.

Hard overrides are preserved: explicit crisis keywords always force CRITICAL.
"""

from typing import Optional

from app.config import settings
from app.models.schemas import (
    LLMRiskSignal,
    RiskAssessment,
    RiskIndicators,
    RiskLevel,
    RiskSignalBreakdown,
    SemanticRiskSignal,
)

# ── Critical-override token set (unchanged from original) ──
_CRITICAL_OVERRIDE_TOKENS = frozenset({
    "suicide", "suicidal", "sucidal", "sucidial", "sucidle", "suicde",
    "kill", "die", "dead", "end my life", "overdose", "unalive",
    "kms", "kys", "ctb",
    "marna", "mar jana", "mar jaana", "jaan de", "khudkushi",
    "aatmhatya", "atmahatya", "kud ja", "kood ja", "zinda nahi",
    "maut", "fansi", "phansi",
})

# Semantic similarity thresholds → risk score mapping.
# Tuned for all-MiniLM-L6-v2 where identical-meaning ≈ 0.85, related ≈ 0.55.
_SEM_CRISIS_THRESHOLDS = [(0.72, 85), (0.60, 65), (0.48, 40)]
_SEM_SELF_HARM_THRESHOLDS = [(0.70, 80), (0.58, 60), (0.46, 35)]
_SEM_SEVERE_THRESHOLDS = [(0.68, 70), (0.55, 50), (0.43, 30)]
_SEM_MODERATE_THRESHOLDS = [(0.65, 45), (0.50, 30), (0.40, 15)]


def _threshold_map(similarity: float, thresholds: list[tuple[float, int]]) -> int:
    for threshold, score in thresholds:
        if similarity >= threshold:
            return score
    return 0


class RiskScorer:

    # ── Signal 1: Rule-based ──

    @staticmethod
    def _compute_rule_score(indicators: RiskIndicators) -> int:
        """
        Max-based scoring driven by the single most severe indicator.
        No dilution: suicidal_score=0.95 → score ≈ 95, not 28.
        """
        # Primary life-threatening signals → full scale (0-100)
        primary = max(
            indicators.suicidal_ideation_score,
            indicators.self_harm_score,
        )
        # Secondary severity signals → scaled to 0-80
        secondary = max(
            indicators.severe_anxiety_score,
            indicators.panic_state_score,
        ) * 0.80

        base = max(primary * 100, secondary * 100)

        # Contextual amplifiers (repetition, history, intensity) can add up to +15
        amp = 0.0
        if indicators.emotional_intensity > 0.3:
            amp += min(indicators.emotional_intensity * 8, 6)
        if indicators.repetition_factor > 0.3:
            amp += min(indicators.repetition_factor * 6, 5)
        if indicators.historical_trend > 0.3:
            amp += min(indicators.historical_trend * 6, 4)

        return int(min(round(base + amp), 100))

    # ── Signal 2: LLM ──

    @staticmethod
    def _compute_llm_score(signal: LLMRiskSignal) -> int:
        """Convert structured LLM output to 0-100 integer."""
        level_map = {"critical": 90, "high": 70, "medium": 40, "low": 10}
        level_score = level_map.get(signal.overall_risk, 10)

        dimension_score = max(
            signal.suicidal_ideation,
            signal.self_harm_risk,
            signal.crisis_severity,
            signal.hopelessness * 0.85,
            signal.emotional_distress * 0.7,
        ) * 100

        raw = max(level_score, dimension_score)
        return int(min(round(raw * signal.confidence + raw * (1 - signal.confidence) * 0.8), 100))

    # ── Signal 3: Semantic ──

    @staticmethod
    def _compute_semantic_score(signal: SemanticRiskSignal) -> int:
        """Map cosine-similarity scores to a 0-100 risk score."""
        return max(
            _threshold_map(signal.crisis_similarity, _SEM_CRISIS_THRESHOLDS),
            _threshold_map(signal.self_harm_similarity, _SEM_SELF_HARM_THRESHOLDS),
            _threshold_map(signal.severe_distress_similarity, _SEM_SEVERE_THRESHOLDS),
            _threshold_map(signal.moderate_distress_similarity, _SEM_MODERATE_THRESHOLDS),
        )

    # ── Hard overrides ──

    @staticmethod
    def _apply_overrides(
        score: int,
        indicators: RiskIndicators,
        llm_signal: Optional[LLMRiskSignal],
    ) -> int:
        joined_flags = " ".join(indicators.keyword_flags).lower()
        has_critical_keyword = any(tok in joined_flags for tok in _CRITICAL_OVERRIDE_TOKENS)

        if has_critical_keyword and score < settings.RISK_THRESHOLD_CRITICAL:
            score = settings.RISK_THRESHOLD_CRITICAL

        if indicators.suicidal_ideation_score >= 0.7 and score < settings.RISK_THRESHOLD_HIGH:
            score = settings.RISK_THRESHOLD_HIGH

        if llm_signal and llm_signal.available:
            if llm_signal.overall_risk == "critical" and score < settings.RISK_THRESHOLD_CRITICAL:
                score = settings.RISK_THRESHOLD_CRITICAL
            if llm_signal.suicidal_ideation >= 0.8 and score < settings.RISK_THRESHOLD_HIGH:
                score = settings.RISK_THRESHOLD_HIGH

        return score

    # ── Classification ──

    @staticmethod
    def _classify(score: int) -> RiskLevel:
        if score >= settings.RISK_THRESHOLD_CRITICAL:
            return RiskLevel.CRITICAL
        if score >= settings.RISK_THRESHOLD_HIGH:
            return RiskLevel.HIGH
        if score >= settings.RISK_THRESHOLD_MEDIUM:
            return RiskLevel.MEDIUM
        return RiskLevel.LOW

    # ── Ensemble entry point ──

    def ensemble_score(
        self,
        indicators: RiskIndicators,
        llm_signal: Optional[LLMRiskSignal] = None,
        semantic_signal: Optional[SemanticRiskSignal] = None,
    ) -> RiskAssessment:
        rule_score = self._compute_rule_score(indicators)

        llm_score = 0
        if llm_signal and llm_signal.available:
            llm_score = self._compute_llm_score(llm_signal)

        semantic_score = 0
        if semantic_signal and semantic_signal.available:
            semantic_score = self._compute_semantic_score(semantic_signal)

        base = max(rule_score, llm_score, semantic_score)

        # Multi-signal agreement bonus: if 2+ signals are HIGH, bump slightly
        high_threshold = settings.RISK_THRESHOLD_HIGH
        signals_high = sum(1 for s in (rule_score, llm_score, semantic_score) if s >= high_threshold)
        if signals_high >= 2:
            base = min(base + 5, 100)

        final = self._apply_overrides(base, indicators, llm_signal)
        level = self._classify(final)
        explanation = self._build_explanation(
            indicators, llm_signal, semantic_signal, final, level,
        )

        signals_used = ["rule"]
        if llm_signal and llm_signal.available:
            signals_used.append("llm")
        if semantic_signal and semantic_signal.available:
            signals_used.append("semantic")

        return RiskAssessment(
            risk_score=final,
            risk_level=level,
            indicators=indicators,
            explanation=explanation,
            requires_immediate_action=level in (RiskLevel.HIGH, RiskLevel.CRITICAL),
            signal_breakdown=RiskSignalBreakdown(
                rule_score=rule_score,
                llm_score=llm_score,
                semantic_score=semantic_score,
                llm_signal=llm_signal if (llm_signal and llm_signal.available) else None,
                semantic_signal=semantic_signal if (semantic_signal and semantic_signal.available) else None,
                ensemble_method="conservative_max",
                signals_used=signals_used,
            ),
        )

    # ── Explanation ──

    @staticmethod
    def _build_explanation(
        indicators: RiskIndicators,
        llm_signal: Optional[LLMRiskSignal],
        semantic_signal: Optional[SemanticRiskSignal],
        score: int,
        level: RiskLevel,
    ) -> str:
        parts: list[str] = []

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
            parts.append("recurring distress patterns")
        if indicators.historical_trend > 0.4:
            parts.append("worsening mood trend")

        if llm_signal and llm_signal.available and llm_signal.concerns:
            parts.append(f"LLM concerns: {', '.join(llm_signal.concerns[:3])}")

        if semantic_signal and semantic_signal.available and semantic_signal.max_similarity > 0.55:
            parts.append(f"semantic match: {semantic_signal.matched_category}")

        if indicators.keyword_flags:
            top = indicators.keyword_flags[:4]
            parts.append(f"flagged: {', '.join(top)}")

        if not parts:
            parts.append("no significant risk indicators detected")

        summary = "; ".join(parts)
        return f"Risk score {score}/100 ({level.value}). {summary.capitalize()}."


risk_scorer = RiskScorer()
