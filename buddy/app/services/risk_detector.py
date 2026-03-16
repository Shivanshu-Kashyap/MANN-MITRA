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
    "wanna die": 90,
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
    "selfharm": 75,
    "hurt myself": 75,
    "plan to die": 95,
    "goodbye letter": 90,
    "final note": 85,
    "don't want to live": 90,
    "dont want to live": 90,
    "i want to end": 85,
    "want to end it": 90,
    "thinking of killing": 95,
    "thinking about suicide": 95,
    "suicidal thoughts": 95,
    "thoughts of suicide": 95,
    "want to jump": 85,
    "kill myself": 95,
}

# Common misspellings / phonetic variants of critical terms
CRITICAL_TYPOS = {
    "sucidal": 90, "sucidial": 90, "sucidle": 90, "suicde": 90,
    "suicdal": 90, "sucide": 90, "suside": 90, "susidal": 90,
    "suicidel": 90, "suicidle": 90, "suiciadal": 90, "siucidal": 90,
    "sewerside": 85, "sewercide": 85, "sewrside": 85,
    "kms": 85, "kys": 90,
    "unalive": 85, "un alive": 85, "unaliving": 85,
    "necide": 85, "necidal": 85,
    "self-harm": 75, "selfharm": 75, "self harming": 75,
    "od": 70, "overdosing": 85,
    "ctb": 85,
}

# Hindi / Hinglish crisis keywords
HINDI_CRITICAL_KEYWORDS = {
    "marna chahta": 95, "marna chahti": 95,
    "mar jana": 90, "mar jaana": 90, "marr jana": 90,
    "khatam karna": 90, "khatam kar": 90,
    "zindagi khatam": 95, "zindagi se tang": 85,
    "jaan de": 90, "jaan dena": 90, "jaan de dunga": 95, "jaan de dungi": 95,
    "suicide karna": 95, "suicide kar": 95,
    "kud jana": 90, "kud jaana": 90, "kud jau": 90, "kud jaau": 90,
    "kood jana": 90, "kood jaana": 90,
    "jeena nahi": 90, "jeene ka mann nahi": 90,
    "nahi jeena": 90, "nahi rehna": 85,
    "maut chahiye": 95, "maut aa jaye": 90,
    "aatmhatya": 95, "aatmahatya": 95, "atmahatya": 95,
    "khudkushi": 95, "khud kushi": 95,
    "fansi": 85, "phansi": 85,
    "zeher": 85, "zahar": 85,
    "naso kat": 90, "nas kat": 90, "nasse kat": 90,
    "goli kha": 85, "goli kha lunga": 90,
    "zinda nahi rehna": 95, "zinda nahi rahna": 95,
    "marr jaunga": 90, "marr jaungi": 90,
    "jeene ka mann": 70, "mann nahi hai": 60,
    "koi fayda nahi": 70, "koi faida nahi": 70,
    "sab khatam": 80, "sab khtm": 80,
}

HINDI_HIGH_KEYWORDS = {
    "bahut bura": 55, "bahut dard": 55,
    "akela": 45, "akeli": 45,
    "tang aa gaya": 60, "tang aa gayi": 60, "tang aa chuka": 60,
    "himmat nahi": 55, "hosla nahi": 55,
    "kuch nahi bacha": 60, "koi nahi hai": 50,
    "pagal ho": 45, "dimag kharab": 45,
    "ro rha": 40, "ro rahi": 40, "rone ka mann": 40,
    "zindagi barbaad": 60, "barbad": 55,
    "nahi ho raha": 45, "nhi ho rha": 45,
    "man nhi lg rha": 45, "man nahi lag raha": 45,
    "achha nhi": 40, "acha nahi": 40,
}

HIGH_KEYWORDS = {
    "hopeless": 60,
    "worthless": 55,
    "no way out": 65,
    "can't go on": 65,
    "cant go on": 65,
    "trapped": 50,
    "burden to everyone": 65,
    "i am a burden": 65,
    "nobody cares": 55,
    "nobody loves me": 60,
    "nothing matters": 55,
    "give up": 50,
    "giving up": 55,
    "hate myself": 55,
    "hate my life": 60,
    "empty inside": 50,
    "severe depression": 60,
    "can't take it anymore": 65,
    "cant take it anymore": 65,
    "can't take it": 60,
    "breaking point": 55,
    "falling apart": 50,
    "no escape": 60,
    "wish i wasn't here": 70,
    "wish i wasnt here": 70,
    "wish i was dead": 80,
    "wish i were dead": 80,
    "disappear": 45,
    "don't deserve to live": 75,
    "dont deserve to live": 75,
    "no point": 50,
    "no purpose": 50,
    "what's the point": 50,
    "whats the point": 50,
    "life is meaningless": 55,
}

MEDIUM_KEYWORDS = {
    "depressed": 35,
    "depression": 35,
    "anxious": 30,
    "anxiety": 30,
    "panic attack": 40,
    "can't cope": 40,
    "cant cope": 40,
    "overwhelmed": 30,
    "scared": 25,
    "alone": 25,
    "so alone": 35,
    "isolated": 30,
    "crying": 25,
    "crying a lot": 35,
    "can't sleep": 30,
    "cant sleep": 30,
    "insomnia": 30,
    "can't eat": 30,
    "cant eat": 30,
    "nightmares": 30,
    "flashback": 35,
    "flashbacks": 35,
    "trauma": 35,
    "cutting": 50,
    "drinking too much": 35,
    "using drugs": 40,
    "panic": 35,
    "can't breathe": 35,
    "cant breathe": 35,
    "shaking": 25,
    "heart racing": 30,
    "no motivation": 30,
    "lost interest": 30,
    "not eating": 30,
    "not sleeping": 30,
    "breakdown": 40,
    "mental breakdown": 45,
}

LOW_KEYWORDS = {
    "stressed": 10,
    "tired": 10,
    "exhausted": 15,
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
    "bad day": 10,
    "not okay": 15,
    "not fine": 15,
}

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


class RiskDetector:
    """Detects risk indicators in user messages using keyword analysis and NLP heuristics."""

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
