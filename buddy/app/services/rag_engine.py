"""
RAG Engine - Retrieval-Augmented Generation for mental health responses.
Queries the vector store, builds context, and generates grounded LLM responses
using Google Gemini.
"""

from typing import Optional
from app.config import settings
from app.services.vector_store import vector_store


SYSTEM_PROMPT = """You are Buddy, a compassionate and supportive AI mental health first-aid assistant 
for college students on the Mann-Mitra platform.

CRITICAL SAFETY RULES:
- You are NOT a therapist or licensed counselor. Never diagnose or prescribe.
- If someone mentions self-harm, suicide, or is in crisis, immediately provide crisis resources 
  and strongly recommend professional help. Do not attempt to counsel them yourself.
- Always validate feelings before offering advice.
- Keep responses concise (2-4 paragraphs), warm, and actionable.
- When relevant knowledge base context is provided, ground your response in that material.
- Always end with encouragement and a gentle nudge toward professional support if appropriate.

Your role:
1. Provide emotional validation and support
2. Share evidence-based coping strategies from the knowledge base
3. Guide users to professional counselors when needed
4. Help users feel heard, less alone, and empowered

Use the CONTEXT below (retrieved from mental health resources) to inform your response.
If the context is not relevant, rely on general mental health first-aid principles.
"""


class RAGEngine:
    def __init__(self):
        self._conversations: dict[str, list[dict]] = {}

    async def generate_response(
        self,
        user_message: str,
        session_id: str,
        risk_level: str = "low",
        topic_hint: Optional[str] = None,
    ) -> dict:
        """
        Full RAG pipeline:
        1. Retrieve relevant context from vector store
        2. Build prompt with context + conversation history
        3. Generate LLM response via Gemini
        """
        retrieved = vector_store.query(
            query_text=user_message,
            severity_filter=risk_level if risk_level in ("high", "critical") else None,
            topic_filter=topic_hint,
        )

        context_text = self._format_context(retrieved)
        sources = [r["metadata"].get("source", "unknown") for r in retrieved]

        history = self._get_history(session_id)
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
        """Route to Gemini or fallback. Degrades gracefully on API errors."""
        if settings.has_gemini:
            try:
                return await self._call_gemini(user_message, context, history, risk_level)
            except Exception as e:
                print(f"[RAGEngine] Gemini call failed, using fallback: {e}")
                return self._fallback_response(user_message, risk_level)
        return self._fallback_response(user_message, risk_level)

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

        system_content = SYSTEM_PROMPT
        if context:
            system_content += f"\n\nCONTEXT FROM KNOWLEDGE BASE:\n{context}"
        if risk_level in ("high", "critical"):
            system_content += (
                "\n\nIMPORTANT: The user's current risk level is "
                f"'{risk_level}'. Be extra careful, compassionate, and "
                "provide crisis resources proactively."
            )

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
                max_output_tokens=600,
                temperature=0.7,
            ),
        )
        return response.text

    @staticmethod
    def _fallback_response(user_message: str, risk_level: str) -> str:
        """Rule-based fallback when no LLM API is configured."""
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

        if any(w in lower for w in ("anxious", "anxiety", "worried", "nervous")):
            return (
                "I understand you're feeling anxious right now, and that's completely valid. "
                "Anxiety can feel overwhelming, but there are techniques that can help.\n\n"
                "Try this: Take a slow breath in for 4 counts, hold for 7, and breathe out for 8. "
                "Repeat 3-4 times.\n\n"
                "If anxiety is a frequent experience for you, talking to a counselor can help "
                "you build long-term coping strategies. I'm here for you."
            )

        if any(w in lower for w in ("depressed", "sad", "down", "hopeless")):
            return (
                "I hear that you're going through a really tough time. Those feelings are valid, "
                "and it takes courage to talk about them.\n\n"
                "Try the 5-4-3-2-1 grounding technique: notice 5 things you see, 4 you can touch, "
                "3 you hear, 2 you smell, and 1 you taste.\n\n"
                "Speaking with a professional counselor can make a real difference. "
                "You deserve support."
            )

        if any(w in lower for w in ("stress", "overwhelmed", "pressure", "burnout")):
            return (
                "It sounds like you're carrying a lot right now. Stress is your body's way of "
                "telling you it needs care.\n\n"
                "Try breaking your tasks into smaller steps and take short breaks. "
                "Progressive muscle relaxation — tensing and releasing each muscle group — "
                "can also help release physical tension.\n\n"
                "If stress is becoming constant, a counselor can help you develop "
                "personalized strategies."
            )

        if any(w in lower for w in ("lonely", "alone", "isolated")):
            return (
                "Feeling lonely can be really painful, and it's more common among students "
                "than you might think. Your feelings are completely understandable.\n\n"
                "Even small connections matter — reaching out to one person, joining a study group, "
                "or visiting your campus wellness center can be a meaningful first step.\n\n"
                "A counselor can also help you work through feelings of isolation."
            )

        return (
            "Thank you for sharing what you're going through. It takes real strength "
            "to reach out.\n\n"
            "I'm here to listen and support you. If you'd like, I can suggest some "
            "coping strategies, or help you connect with a professional counselor "
            "who can provide personalized guidance.\n\n"
            "What would be most helpful for you right now?"
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
