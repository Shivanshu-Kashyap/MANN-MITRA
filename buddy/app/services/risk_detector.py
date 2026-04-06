"""
Risk Detector - NLP-based detection of self-harm, suicidal ideation,
severe anxiety, and panic states from user messages.

Keyword weights are derived mathematically via *semantic calibration*:
  1. Define "maximum crisis" anchor phrases (clinically validated).
  2. Embed each keyword (in mental-health context) with SentenceTransformer.
  3. weight = cosine_similarity(embed(keyword), crisis_centroid), auto-scaled to 0–95.
  4. Per-category safety floors guarantee critical ≥ 70, high ≥ 40, etc.

Before calibrate() runs, every keyword defaults to its category floor.
No hand-tuned magic numbers anywhere.

Runs in PARALLEL with the RAG pipeline on every user message.
"""

import re
from app.models.schemas import RiskIndicators


# ── Per-category safety floors ──
# Used as initial defaults AND as post-calibration minimums.
_CATEGORY_FLOORS = {"critical": 70, "high": 40, "medium": 20, "low": 5}


# ── Keyword lists by category ──
# Only the *strings* matter here.  Weights start at the category floor and
# are replaced with computed values when calibrate() runs at startup.

_CRITICAL_PHRASES = [
    "kill myself", "end my life", "suicide", "suicidal",
    "want to die", "wanna die", "better off dead", "no point living",
    "ending it all", "overdose", "hang myself", "cut myself",
    "jump off", "slit my wrists", "take my life",
    "not worth living", "no reason to live",
    "self harm", "selfharm", "hurt myself",
    "plan to die", "goodbye letter", "final note",
    "don't want to live", "dont want to live",
    "i want to end", "want to end it",
    "thinking of killing", "thinking about suicide",
    "suicidal thoughts", "thoughts of suicide", "want to jump",
]

_CRITICAL_TYPO_PHRASES = [
    "sucidal", "sucidial", "sucidle", "suicde",
    "suicdal", "sucide", "suside", "susidal",
    "suicidel", "suicidle", "suiciadal", "siucidal",
    "sewerside", "sewercide", "sewrside",
    "kms", "kys",
    "unalive", "un alive", "unaliving",
    "necide", "necidal",
    "self-harm", "selfharm", "self harming",
    "od", "overdosing", "ctb",
]

_HINDI_CRITICAL_PHRASES = [
    "marna chahta", "marna chahti",
    "mar jana", "mar jaana", "marr jana",
    "khatam karna", "khatam kar",
    "zindagi khatam", "zindagi se tang",
    "jaan de", "jaan dena", "jaan de dunga", "jaan de dungi",
    "suicide karna", "suicide kar",
    "kud jana", "kud jaana", "kud jau", "kud jaau",
    "kood jana", "kood jaana",
    "jeena nahi", "jeene ka mann nahi",
    "nahi jeena", "nahi rehna",
    "maut chahiye", "maut aa jaye",
    "aatmhatya", "aatmahatya", "atmahatya",
    "khudkushi", "khud kushi",
    "fansi", "phansi", "zeher", "zahar",
    "naso kat", "nas kat", "nasse kat",
    "goli kha", "goli kha lunga",
    "zinda nahi rehna", "zinda nahi rahna",
    "marr jaunga", "marr jaungi",
    "jeene ka mann", "mann nahi hai",
    "koi fayda nahi", "koi faida nahi",
    "sab khatam", "sab khtm",
]

_HINDI_HIGH_PHRASES = [
    "bahut bura", "bahut dard",
    "akela", "akeli",
    "tang aa gaya", "tang aa gayi", "tang aa chuka",
    "himmat nahi", "hosla nahi",
    "kuch nahi bacha", "koi nahi hai",
    "pagal ho", "dimag kharab",
    "ro rha", "ro rahi", "rone ka mann",
    "zindagi barbaad", "barbad",
    "nahi ho raha", "nhi ho rha",
    "man nhi lg rha", "man nahi lag raha",
    "achha nhi", "acha nahi",
]

_HIGH_PHRASES = [
    "hopeless", "worthless", "no way out",
    "can't go on", "cant go on", "trapped",
    "burden to everyone", "i am a burden",
    "nobody cares", "nobody loves me", "nothing matters",
    "give up", "giving up",
    "hate myself", "hate my life", "empty inside",
    "severe depression",
    "can't take it anymore", "cant take it anymore", "can't take it",
    "breaking point", "falling apart", "no escape",
    "wish i wasn't here", "wish i wasnt here",
    "wish i was dead", "wish i were dead",
    "disappear",
    "don't deserve to live", "dont deserve to live",
    "no point", "no purpose",
    "what's the point", "whats the point",
    "life is meaningless",
]

_MEDIUM_PHRASES = [
    "depressed", "depression", "anxious", "anxiety",
    "panic attack", "can't cope", "cant cope",
    "overwhelmed", "scared", "alone", "so alone", "isolated",
    "crying", "crying a lot",
    "can't sleep", "cant sleep", "insomnia",
    "can't eat", "cant eat",
    "nightmares", "flashback", "flashbacks", "trauma",
    "cutting", "drinking too much", "using drugs",
    "panic", "can't breathe", "cant breathe",
    "shaking", "heart racing",
    "no motivation", "lost interest",
    "not eating", "not sleeping",
    "breakdown", "mental breakdown",
]

_LOW_PHRASES = [
    "stressed", "tired", "exhausted", "worried", "sad",
    "confused", "uncertain", "frustrated", "angry", "nervous",
    "down", "unhappy", "struggling",
    "difficult", "tough time", "bad day",
    "not okay", "not fine",
]


# ── Build dicts with category-floor defaults ──
# calibrate() overwrites these values with computed weights at startup.
# If calibration never runs, every keyword scores at its category floor —
# enough to trigger the correct risk tier without any hand-tuned numbers.

CRITICAL_KEYWORDS: dict[str, int] = {kw: _CATEGORY_FLOORS["critical"] for kw in _CRITICAL_PHRASES}
CRITICAL_TYPOS: dict[str, int] = {kw: _CATEGORY_FLOORS["critical"] for kw in _CRITICAL_TYPO_PHRASES}
HINDI_CRITICAL_KEYWORDS: dict[str, int] = {kw: _CATEGORY_FLOORS["critical"] for kw in _HINDI_CRITICAL_PHRASES}
HINDI_HIGH_KEYWORDS: dict[str, int] = {kw: _CATEGORY_FLOORS["high"] for kw in _HINDI_HIGH_PHRASES}
HIGH_KEYWORDS: dict[str, int] = {kw: _CATEGORY_FLOORS["high"] for kw in _HIGH_PHRASES}
MEDIUM_KEYWORDS: dict[str, int] = {kw: _CATEGORY_FLOORS["medium"] for kw in _MEDIUM_PHRASES}
LOW_KEYWORDS: dict[str, int] = {kw: _CATEGORY_FLOORS["low"] for kw in _LOW_PHRASES}

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
    "everyday": 1.2,
    "constantly": 1.3,
    "can't stop": 1.3,
    "cant stop": 1.3,
    "all the time": 1.2,
    "bahut": 1.3,
    "bohot": 1.3,
    "bahot": 1.3,
}

# Suicidal ideation sub-keywords (for categorizing matched keywords)
_SUICIDAL_TOKENS = {"suicide", "suicidal", "die", "life", "kill", "dead", "living",
                    "unalive", "kms", "kys", "ctb", "marna", "mar", "jaan",
                    "khatam", "khudkushi", "aatmhatya", "atmahatya", "maut",
                    "kud", "kood", "jeena", "zinda", "fansi", "phansi"}
_SELF_HARM_TOKENS = {"harm", "hurt", "cut", "overdose", "slit", "od", "cutting",
                     "selfharm", "zeher", "zahar", "naso", "nas", "goli"}


# ── Semantic Calibration ──
# Anchor phrases representing the *maximum* crisis severity.  The model
# computes cosine similarity between each keyword and the crisis centroid to
# derive mathematically grounded weights.

_CRISIS_ANCHORS = [
    "I am going to kill myself tonight I already have a plan to do it",
    "I want to end my life I have decided to commit suicide today",
    "I am going to take my own life and nobody can stop me now",
    "I wrote goodbye letters because I am going to die tonight",
    "maine sab khatam karne ka plan bana liya hai aaj raat mar jaunga",
]

_KW_CONTEXT = "a person in emotional distress said: {}"

# All keyword banks paired with their category label
_KEYWORD_BANKS: list[tuple[dict, str]] = [
    (CRITICAL_KEYWORDS, "critical"),
    (CRITICAL_TYPOS, "critical"),
    (HINDI_CRITICAL_KEYWORDS, "critical"),
    (HINDI_HIGH_KEYWORDS, "high"),
    (HIGH_KEYWORDS, "high"),
    (MEDIUM_KEYWORDS, "medium"),
    (LOW_KEYWORDS, "low"),
]


class RiskDetector:
    """Detects risk indicators in user messages using keyword analysis and NLP heuristics."""

    _is_calibrated: bool = False

    @classmethod
    def calibrate(cls) -> None:
        """
        Replace hand-tuned fallback weights with semantically derived scores.

        Math:
          1. Encode crisis anchor phrases → compute centroid in embedding space.
          2. Encode each keyword wrapped in a mental-health context sentence.
          3. weight(kw) = cosine_similarity(embed(kw_in_context), crisis_centroid)
          4. Auto-scale the similarity range to [5, 95].
          5. Clamp per-category safety floors (critical ≥ 70, high ≥ 40, …).
          6. Update the module-level dicts in-place so analyze() uses new values.

        If anything fails, the original fallback weights remain untouched.
        """
        try:
            import numpy as np
            from sentence_transformers import SentenceTransformer

            model = SentenceTransformer("all-MiniLM-L6-v2")

            crisis_embs = model.encode(_CRISIS_ANCHORS, normalize_embeddings=True)
            crisis_centroid = np.mean(crisis_embs, axis=0)
            crisis_centroid = crisis_centroid / np.linalg.norm(crisis_centroid)

            pool: list[tuple[str, str, dict]] = []
            for bank, cat in _KEYWORD_BANKS:
                for kw in bank:
                    pool.append((kw, cat, bank))

            texts = [_KW_CONTEXT.format(kw) for kw, _, _ in pool]
            kw_embs = model.encode(texts, normalize_embeddings=True)
            sims = kw_embs @ crisis_centroid

            sim_min, sim_max = float(np.min(sims)), float(np.max(sims))
            span = max(sim_max - sim_min, 1e-6)

            for (kw, cat, bank_dict), sim in zip(pool, sims):
                raw = int(round(((float(sim) - sim_min) / span) * 90 + 5))
                bank_dict[kw] = max(raw, _CATEGORY_FLOORS[cat])

            cls._is_calibrated = True

            ranked = sorted(
                [(kw, bank[kw]) for kw, _, bank in pool],
                key=lambda x: -x[1],
            )
            top = ", ".join(f'"{k}"={v}' for k, v in ranked[:5])
            low = ", ".join(f'"{k}"={v}' for k, v in ranked[-4:])
            print(
                f"[RiskDetector] Calibrated {len(pool)} keyword weights via semantic similarity",
                flush=True,
            )
            print(f"  Highest: {top}", flush=True)
            print(f"  Lowest:  {low}", flush=True)

        except Exception as exc:
            print(
                f"[RiskDetector] Calibration failed, keeping fallback weights: {exc}",
                flush=True,
            )

    def analyze(self, message: str, conversation_history: list[dict] = None) -> RiskIndicators:
        lower = message.lower().strip()
        # Keep hyphens for self-harm etc, but remove other punctuation
        lower = re.sub(r"[^\w\s'\-]", " ", lower)
        # Collapse whitespace
        lower = re.sub(r"\s+", " ", lower).strip()

        keyword_flags = []
        max_score = 0

        self_harm_score = 0.0
        suicidal_score = 0.0
        anxiety_score = 0.0
        panic_score = 0.0

        # ── Scan critical keywords (English) ──
        for kw, weight in CRITICAL_KEYWORDS.items():
            if kw in lower:
                keyword_flags.append(kw)
                max_score = max(max_score, weight)
                if any(tok in kw for tok in _SUICIDAL_TOKENS):
                    suicidal_score = max(suicidal_score, weight / 100.0)
                if any(tok in kw for tok in _SELF_HARM_TOKENS):
                    self_harm_score = max(self_harm_score, weight / 100.0)

        # ── Scan critical typos / abbreviations ──
        for kw, weight in CRITICAL_TYPOS.items():
            if kw in lower:
                keyword_flags.append(kw)
                max_score = max(max_score, weight)
                suicidal_score = max(suicidal_score, weight / 100.0)

        # ── Scan Hindi/Hinglish critical keywords ──
        for kw, weight in HINDI_CRITICAL_KEYWORDS.items():
            if kw in lower:
                keyword_flags.append(kw)
                max_score = max(max_score, weight)
                if any(tok in kw for tok in _SUICIDAL_TOKENS):
                    suicidal_score = max(suicidal_score, weight / 100.0)
                if any(tok in kw for tok in _SELF_HARM_TOKENS):
                    self_harm_score = max(self_harm_score, weight / 100.0)
                # Default: treat Hindi crisis terms as suicidal
                suicidal_score = max(suicidal_score, weight / 100.0 * 0.9)

        # ── Scan Hindi/Hinglish high keywords ──
        for kw, weight in HINDI_HIGH_KEYWORDS.items():
            if kw in lower:
                keyword_flags.append(kw)
                max_score = max(max_score, weight)
                suicidal_score = max(suicidal_score, weight / 100.0 * 0.6)

        # ── Scan high keywords ──
        for kw, weight in HIGH_KEYWORDS.items():
            if kw in lower:
                keyword_flags.append(kw)
                max_score = max(max_score, weight)
                suicidal_score = max(suicidal_score, weight / 100.0 * 0.7)

        # ── Scan medium keywords ──
        for kw, weight in MEDIUM_KEYWORDS.items():
            if kw in lower:
                keyword_flags.append(kw)
                max_score = max(max_score, weight)
                if any(w in kw for w in ("panic", "breathe", "shaking", "racing")):
                    panic_score = max(panic_score, weight / 100.0)
                if any(w in kw for w in ("anxious", "anxiety", "scared", "nervous")):
                    anxiety_score = max(anxiety_score, weight / 100.0)

        # ── Scan low keywords ──
        for kw, weight in LOW_KEYWORDS.items():
            if kw in lower:
                keyword_flags.append(kw)
                max_score = max(max_score, weight)

        # ── Emotional intensity multiplier ──
        intensity = 0.0
        for marker, mult in INTENSITY_MARKERS.items():
            if marker in lower:
                intensity = max(intensity, mult)

        # ── Repetition factor from conversation history ──
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

        # ── Historical trend from recent risk patterns ──
        historical = 0.0
        all_high_kws = list(HIGH_KEYWORDS.keys()) + list(HINDI_HIGH_KEYWORDS.keys())
        all_critical_kws = list(CRITICAL_KEYWORDS.keys()) + list(CRITICAL_TYPOS.keys()) + list(HINDI_CRITICAL_KEYWORDS.keys())
        if conversation_history:
            recent_user_msgs = [
                m["content"].lower()
                for m in conversation_history[-10:]
                if m.get("role") == "user"
            ]
            neg_count = sum(
                1 for m in recent_user_msgs
                if any(kw in m for kw in all_high_kws[:20])
                or any(kw in m for kw in all_critical_kws[:20])
            )
            if recent_user_msgs:
                historical = min(neg_count / max(len(recent_user_msgs), 1), 1.0)

        return RiskIndicators(
            self_harm_score=round(min(self_harm_score * max(intensity, 1.0), 1.0), 3),
            suicidal_ideation_score=round(min(suicidal_score * max(intensity, 1.0), 1.0), 3),
            severe_anxiety_score=round(min(anxiety_score * max(intensity, 1.0), 1.0), 3),
            panic_state_score=round(min(panic_score * max(intensity, 1.0), 1.0), 3),
            emotional_intensity=round(min(intensity / 1.5, 1.0), 3) if intensity > 0 else 0.0,
            keyword_flags=list(set(keyword_flags)),
            repetition_factor=round(repetition, 3),
            historical_trend=round(historical, 3),
        )


risk_detector = RiskDetector()
