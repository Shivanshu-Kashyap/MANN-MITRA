"""
Semantic Risk Scorer — cosine similarity between user messages and
clinically-informed reference phrases for each risk category.

Uses the same SentenceTransformer model (all-MiniLM-L6-v2) already loaded for RAG
vector search, so no extra model download or memory cost.

Reference phrases are curated to represent canonical expressions of each risk
category.  For each category the scorer computes max-similarity to ANY reference
(not centroid-mean) so that a single very close match triggers detection even if
other references in the category are dissimilar.

Typical latency: ~10-15 ms on CPU per message (single encode + dot products).
"""

from __future__ import annotations

import numpy as np

from app.models.schemas import SemanticRiskSignal

# ── Clinically-informed reference phrases per risk category ──

_CRISIS_REFS = [
    "I want to end my life and I have a plan to do it",
    "I'm going to kill myself tonight",
    "I don't want to be alive anymore",
    "Nobody would care if I was gone forever",
    "I've decided to end it all there's no other way",
    "I wrote a goodbye letter to my family",
    "I have been stockpiling pills to overdose",
    "marna chahta hun aur plan bana liya hai",
    "zindagi khatam karna chahta hun koi raasta nahi",
    "khudkushi karna chahta hun aaj raat",
]

_SELF_HARM_REFS = [
    "I've been cutting myself to cope with the pain",
    "I want to hurt myself physically to feel something",
    "I burn myself when everything gets too overwhelming",
    "I keep hitting myself when I feel out of control",
    "I scratch my skin until it bleeds when I'm upset",
    "khud ko hurt karna chahta hun dard de ke",
]

_SEVERE_DISTRESS_REFS = [
    "I feel completely hopeless and nothing will ever get better",
    "I'm in so much emotional pain that I can't bear it anymore",
    "I feel like a burden to everyone around me and they'd be better off without me",
    "There's no way out of this suffering I see no escape",
    "I can't stop crying and I genuinely don't know how to keep going",
    "Everything feels pointless and I have lost all motivation to live normally",
    "koi raasta nahi dikh raha bahut takleef hai himmat nahi",
]

_MODERATE_DISTRESS_REFS = [
    "I've been feeling really anxious and I can't control my worry",
    "I'm having panic attacks regularly and they terrify me",
    "I feel depressed and can't find motivation for anything at all",
    "I'm so overwhelmed with everything happening in my life right now",
    "I haven't been sleeping or eating properly for weeks",
    "bahut tension ho rahi hai kuch samajh nahi aa raha neend nahi aati",
]

_UNAVAILABLE = SemanticRiskSignal(available=False)


class RiskSemanticScorer:
    def __init__(self):
        self._model = None
        self._ref_embeddings: dict[str, np.ndarray] = {}  # category → (N, dim)
        self._initialized = False

    def initialize(self):
        """Pre-compute reference embeddings.  Call once at startup."""
        try:
            from sentence_transformers import SentenceTransformer

            self._model = SentenceTransformer("all-MiniLM-L6-v2")

            for category, refs in [
                ("crisis", _CRISIS_REFS),
                ("self_harm", _SELF_HARM_REFS),
                ("severe_distress", _SEVERE_DISTRESS_REFS),
                ("moderate_distress", _MODERATE_DISTRESS_REFS),
            ]:
                emb = self._model.encode(refs, normalize_embeddings=True)
                self._ref_embeddings[category] = np.asarray(emb)

            self._initialized = True
            total = sum(e.shape[0] for e in self._ref_embeddings.values())
            print(
                f"[RiskSemanticScorer] Ready — {total} reference embeddings across "
                f"{len(self._ref_embeddings)} categories",
                flush=True,
            )
        except Exception as exc:
            print(f"[RiskSemanticScorer] Init failed (will fall back to rule+LLM): {exc}", flush=True)

    def score(self, message: str) -> SemanticRiskSignal:
        if not self._initialized or self._model is None:
            return _UNAVAILABLE

        try:
            msg_emb = self._model.encode([message], normalize_embeddings=True)[0]
            scores: dict[str, float] = {}
            for category, ref_matrix in self._ref_embeddings.items():
                sims = ref_matrix @ msg_emb  # (N,) dot products
                scores[category] = float(max(0.0, np.max(sims)))

            best_cat = max(scores, key=scores.get)  # type: ignore[arg-type]

            return SemanticRiskSignal(
                crisis_similarity=round(scores.get("crisis", 0.0), 4),
                self_harm_similarity=round(scores.get("self_harm", 0.0), 4),
                severe_distress_similarity=round(scores.get("severe_distress", 0.0), 4),
                moderate_distress_similarity=round(scores.get("moderate_distress", 0.0), 4),
                max_similarity=round(scores[best_cat], 4),
                matched_category=best_cat,
            )
        except Exception as exc:
            print(f"[RiskSemanticScorer] Scoring error: {exc}", flush=True)
            return _UNAVAILABLE


risk_semantic_scorer = RiskSemanticScorer()
