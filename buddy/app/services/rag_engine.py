"""
RAG Engine - Retrieval-Augmented Generation for mental health responses.
Queries the vector store, builds context, and generates grounded LLM responses
via Google Gemini, with OpenRouter fallback when Gemini errors or quota is exceeded.
"""

from typing import Optional
import httpx
from app.config import settings
from app.services.vector_store import vector_store


def _dedupe_retrieved_chunks(items: list[dict], max_k: int) -> list[dict]:
    """Drop near-duplicate chunks so context stays diverse within token budget."""
    seen: set[str] = set()
    out: list[dict] = []
    for r in items:
        key = (r.get("text") or "")[:160].strip()
        if not key or key in seen:
            continue
        seen.add(key)
        out.append(r)
        if len(out) >= max_k:
            break
    return out


def _retrieval_query_text(user_message: str, history: list[dict]) -> str:
    """Bias embedding search toward ongoing thread (e.g. 'that' / follow-ups)."""
    u = (user_message or "").strip()
    if not history:
        return u
    for msg in reversed(history[-8:]):
        if msg.get("role") != "user":
            continue
        prev = (msg.get("content") or "").strip()
        if prev and prev != u:
            return f"{prev[:600]}\n\n{u}"
    return u


SYSTEM_PROMPT = """You are Buddy, a compassionate mental health first-aid assistant for college students
on Mann-Mitra. Sound human, warm, and specific—not generic.

CRITICAL SAFETY:
- You are NOT a therapist. Never diagnose, label disorders, or prescribe medication.
- If the user mentions self-harm, suicide, or immediate danger: prioritize crisis resources (988, 911,
  Crisis Text HOME to 741741) and urge professional help; do not try to "fix" the crisis alone.
- Validate before advising. Mirror the user's situation briefly in your own words so they feel heard.

HOW TO ANSWER (like a thoughtful support chat, similar to a good RAG mental health bot):
1. Start with 1–2 sentences that reflect what they actually said (their situation or feeling), not a template.
2. If CONTEXT from the knowledge base is provided and relevant, build your practical guidance FROM it
   (techniques, steps, framing). Prefer concrete steps from context over vague reassurance.
3. If context is missing or not relevant, use careful general first-aid—do not invent citations or pretend
   the context said things it did not.
4. Match length to the question: short question → shorter reply; complex or distressed → a bit more depth
   (still readable, not a lecture).
5. Close with gentle encouragement and, when appropriate, one clear suggestion (e.g. counselor, campus
  resources)—not a stack of disclaimers.

Topics you may address when grounded in context or safe general support: anxiety, panic, stress, low mood,
sleep, loneliness, CBT-style coping, mindfulness, relationships, substance concerns (refer out, don't diagnose),
and general wellbeing.
"""


def _build_system_instruction(context: str, risk_level: str) -> str:
    system_content = SYSTEM_PROMPT
    if context:
        system_content += (
            "\n\nCONTEXT FROM KNOWLEDGE BASE (use for factual steps and framing when relevant):\n"
            f"{context}"
        )
    if risk_level in ("high", "critical"):
        system_content += (
            "\n\nIMPORTANT: The user's assessed risk level is "
            f"'{risk_level}'. Be compassionate, avoid minimizing distress, and include crisis "
            "resources when there is any hint of self-harm or hopelessness; recommend professional help."
        )
    return system_content


class RAGEngine:
    def __init__(self):
        self._conversations: dict[str, list[dict]] = {}

    def seed_session_history(self, session_id: str, messages: list[dict]):
        """Replace in-memory turns (e.g. after loading from Mongo)."""
        clean = []
        for m in messages or []:
            role = m.get("role")
            if role not in ("user", "assistant"):
                continue
            c = (m.get("content") or "").strip()
            if c:
                clean.append({"role": role, "content": c})
        self._conversations[session_id] = clean[-settings.MAX_HISTORY_LENGTH :]

    async def generate_response(
        self,
        user_message: str,
        session_id: str,
        risk_level: str = "low",
        topic_hint: Optional[str] = None,
        prior_messages: Optional[list[dict]] = None,
    ) -> dict:
        """
        Full RAG pipeline:
        1. Retrieve relevant context from vector store
        2. Build prompt with context + conversation history
        3. Generate LLM response via Gemini

        prior_messages: completed turns before this user_message (e.g. from Mongo). When set,
        overwrites in-memory history for this session so restarts and multi-instance stay coherent.
        """
        if prior_messages is not None:
            self.seed_session_history(session_id, prior_messages)

        history = self._get_history(session_id)
        retrieve_q = _retrieval_query_text(user_message, history)
        pool = min(max(settings.RAG_TOP_K * 2, settings.RAG_TOP_K + 3), 24)

        # Do not filter by chunk severity vs user risk: most KB chunks are tagged "low" and
        # high-risk users still need normal coping/sleep/anxiety content. Topic hint narrows search
        # but vector_store falls back to pure semantic search if hits are sparse (many chunks are "general").
        retrieved = vector_store.query(
            query_text=retrieve_q,
            n_results=pool,
            topic_filter=topic_hint,
            allow_topic_fallback=True,
        )
        retrieved = _dedupe_retrieved_chunks(retrieved, settings.RAG_TOP_K)

        context_text = self._format_context(retrieved)
        sources = [r["metadata"].get("source", "unknown") for r in retrieved]

        reply = await self._call_llm(user_message, context_text, history, risk_level)

        self._update_history(session_id, user_message, reply)

        return {
            "reply": reply,
            "rag_context_used": len(retrieved) > 0,
            "sources": list(set(sources)),
            "retrieved_chunks": len(retrieved),
        }

    async def _call_llm(
        self,
        user_message: str,
        context: str,
        history: list[dict],
        risk_level: str,
    ) -> str:
        """Try Gemini, then OpenRouter on failure, then rule-based fallback."""
        if settings.has_gemini:
            try:
                return await self._call_gemini(user_message, context, history, risk_level)
            except Exception as e:
                print(f"[RAGEngine] Gemini call failed: {e}")
                if settings.has_openrouter:
                    try:
                        return await self._call_openrouter(user_message, context, history, risk_level)
                    except Exception as e2:
                        print(f"[RAGEngine] OpenRouter call failed, using fallback: {e2}")
                return self._fallback_response(user_message, risk_level, history)
        if settings.has_openrouter:
            try:
                return await self._call_openrouter(user_message, context, history, risk_level)
            except Exception as e:
                print(f"[RAGEngine] OpenRouter call failed, using fallback: {e}")
        return self._fallback_response(user_message, risk_level, history)

    async def _call_gemini(
        self,
        user_message: str,
        context: str,
        history: list[dict],
        risk_level: str,
    ) -> str:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=settings.GEMINI_API_KEY)

        system_content = _build_system_instruction(context, risk_level)

        # Build contents list from history + current message
        contents = []
        for msg in history[-settings.MAX_HISTORY_LENGTH:]:
            role = "user" if msg["role"] == "user" else "model"
            contents.append(types.Content(role=role, parts=[types.Part.from_text(text=msg["content"])]))
        contents.append(types.Content(role="user", parts=[types.Part.from_text(text=user_message)]))

        response = await client.aio.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_content,
                max_output_tokens=900,
                temperature=0.45,
            ),
        )
        text = (response.text or "").strip()
        if not text:
            raise RuntimeError("Empty model response")
        return text

    async def _call_openrouter(
        self,
        user_message: str,
        context: str,
        history: list[dict],
        risk_level: str,
    ) -> str:
        """OpenAI-compatible chat completions (https://openrouter.ai/docs)."""
        system_content = _build_system_instruction(context, risk_level)
        messages: list[dict] = [{"role": "system", "content": system_content}]
        for msg in history[-settings.MAX_HISTORY_LENGTH :]:
            role = msg.get("role")
            if role not in ("user", "assistant"):
                continue
            messages.append({"role": role, "content": msg.get("content", "")})
        messages.append({"role": "user", "content": user_message})

        url = settings.openrouter_chat_completions_url()
        headers = {
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
            "messages": messages,
            "temperature": 0.45,
            "max_tokens": 1024,
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code >= 400:
                snippet = (resp.text or "")[:900].replace("\n", " ")
                print(
                    f"[RAGEngine] OpenRouter HTTP {resp.status_code} url={url!r} "
                    f"model={settings.OPENROUTER_MODEL!r} body={snippet!r}"
                )
            resp.raise_for_status()
            data = resp.json()

        choice = (data.get("choices") or [{}])[0]
        msg = choice.get("message") or {}
        text = (msg.get("content") or "").strip()
        if not text:
            raise RuntimeError("Empty OpenRouter response")
        return text

    @staticmethod
    def _fallback_response(user_message: str, risk_level: str, history: Optional[list[dict]] = None) -> str:
        """Context-aware fallback when no LLM response is available."""
        lower = user_message.lower()

        if risk_level in ("high", "critical"):
            return (
                "I hear you, and I want you to know that what you're feeling matters deeply. "
                "Please reach out to a crisis resource right away:\n\n"
                "- Emergency: 911\n"
                "- Crisis Lifeline: 988\n"
                "- Crisis Text: Text HOME to 741741\n\n"
                "You don't have to face this alone. A professional counselor can provide "
                "the support you deserve. Would you like me to help you book a session?"
            )

        stressors = []
        if any(w in lower for w in ("exam", "result", "marks", "grade", "test", "college")):
            stressors.append("exam_result")
        if any(w in lower for w in ("future", "career", "job", "placement")):
            stressors.append("future")
        if any(w in lower for w in ("sleep", "insomnia", "can't sleep", "cant sleep")):
            stressors.append("sleep")

        emotions = []
        if any(w in lower for w in ("anxious", "anxiety", "worried", "nervous", "panic")):
            emotions.append("anxiety")
        if any(w in lower for w in ("stress", "stressed", "overwhelmed", "pressure", "burnout")):
            emotions.append("stress")
        if any(w in lower for w in ("sad", "down", "hopeless", "empty")):
            emotions.append("low_mood")
        if any(w in lower for w in ("alone", "lonely", "isolated")):
            emotions.append("lonely")

        seed = len(lower) + sum(ord(c) for c in lower[:24]) + len((history or []))
        def pick(options: list[str]) -> str:
            return options[seed % len(options)]

        validation = pick([
            "Thank you for sharing this — what you are feeling makes sense.",
            "I hear you, and it is understandable to feel this way in this situation.",
            "You are not overreacting; this sounds genuinely heavy.",
        ])

        if "exam_result" in stressors:
            actions = [
                "Do a 10-minute brain reset first: 4-7-8 breathing for 3 rounds, then drink water.",
                "Write two columns: 'What I can control this week' and 'What I can't control right now'. Focus only on the first column.",
                "Make a micro-plan for tomorrow with just 3 tasks (one easy, one important, one self-care).",
            ]
            follow_up = "Do you want help creating a simple 3-task plan for tonight and tomorrow?"
        elif "future" in stressors:
            actions = [
                "Name one short-term goal for the next 7 days instead of solving the full future today.",
                "Use a 15-minute 'worry window': note worries, then return to one concrete action.",
                "Reach out to one trusted person (friend/mentor) and share one specific concern.",
            ]
            follow_up = "Would you like me to help you break your future worries into next-week actions?"
        elif "sleep" in stressors:
            actions = [
                "Try a wind-down routine: no results/news scrolling for 30 minutes before sleep.",
                "Do slow breathing: inhale 4, hold 4, exhale 6 for 2 minutes.",
                "If thoughts race, dump them into a notes app so your mind can pause.",
            ]
            follow_up = "Want a 20-minute pre-sleep routine tailored for tonight?"
        elif "anxiety" in emotions:
            actions = [
                "Try 5-4-3-2-1 grounding to settle your nervous system right now.",
                "Take one slow exhale longer than inhale (for example in 4, out 6) for 2 minutes.",
                "Label the thought: 'This is anxiety talking, not a final truth.'",
            ]
            follow_up = "Should we do a 60-second grounding exercise together right now?"
        elif "stress" in emotions:
            actions = [
                "Break your work into one 25-minute focus block and one 5-minute break.",
                "Do shoulder/neck release for 2 minutes to reduce physical stress load.",
                "Pick one task to finish today; defer the rest without guilt.",
            ]
            follow_up = "Want me to help you pick your single most important task for now?"
        elif "low_mood" in emotions:
            actions = [
                "Do one small activation step (wash face, short walk, or open window for fresh air).",
                "Text one trusted person a simple check-in message.",
                "Set a 10-minute timer and start with the easiest activity.",
            ]
            follow_up = "Would you like a tiny 'next 10 minutes' plan to get unstuck?"
        elif "lonely" in emotions:
            actions = [
                "Send one low-pressure message to someone you trust.",
                "Spend 10 minutes in a shared space (library/common room) to reduce isolation.",
                "Join one small activity/study group this week.",
            ]
            follow_up = "Would you like ideas for low-pressure ways to reconnect with people?"
        else:
            actions = [
                "Pause for one minute: unclench jaw/shoulders and take 5 slow breaths.",
                "Name your biggest stressor in one sentence and choose one next step.",
                "If this keeps repeating daily, consider a counselor for structured support.",
            ]
            follow_up = "What feels hardest right now — thoughts, body symptoms, or uncertainty?"

        prior_assistant = ""
        if history:
            for msg in reversed(history):
                if msg.get("role") == "assistant":
                    prior_assistant = msg.get("content", "").lower()
                    break
        duplicate_guard = ""
        if "4-7-8 breathing" in prior_assistant:
            duplicate_guard = "\n\nLet's avoid repeating the same strategy this time and try a different one."

        action_block = "\n".join([f"- {a}" for a in actions[:3]])
        return (
            f"{validation}{duplicate_guard}\n\n"
            "Here are 3 targeted steps you can try right now:\n"
            f"{action_block}\n\n"
            f"{follow_up} If this anxiety or stress keeps building, connecting with a counselor can really help."
        )

    @staticmethod
    def _format_context(results: list[dict]) -> str:
        if not results:
            return ""
        parts = []
        for i, r in enumerate(results, 1):
            source = r["metadata"].get("source", "unknown")
            topic = r["metadata"].get("topic", "")
            parts.append(f"[Source {i}: {source} | Topic: {topic}]\n{r['text']}")
        return "\n\n---\n\n".join(parts)

    def _get_history(self, session_id: str) -> list[dict]:
        return self._conversations.get(session_id, [])

    def _update_history(self, session_id: str, user_msg: str, assistant_msg: str):
        if session_id not in self._conversations:
            self._conversations[session_id] = []
        history = self._conversations[session_id]
        history.append({"role": "user", "content": user_msg})
        history.append({"role": "assistant", "content": assistant_msg})
        if len(history) > settings.MAX_HISTORY_LENGTH:
            self._conversations[session_id] = history[-settings.MAX_HISTORY_LENGTH:]

    def clear_session(self, session_id: str):
        self._conversations.pop(session_id, None)

    def get_session_messages(self, session_id: str) -> list[dict]:
        return self._conversations.get(session_id, [])


rag_engine = RAGEngine()
