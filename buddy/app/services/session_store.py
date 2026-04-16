"""
Session Store - Persists chat sessions and risk history to MongoDB.
Connects to the same MongoDB instance as the Node.js server.
"""

from datetime import datetime
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings


def normalize_stored_messages(raw: Optional[list]) -> list[dict]:
    """Strip Mongo message docs to role/content for LLM + risk history."""
    out = []
    for m in raw or []:
        role = m.get("role")
        if role not in ("user", "assistant"):
            continue
        content = (m.get("content") or "").strip()
        if content:
            out.append({"role": role, "content": content})
    return out


class SessionStore:
    def __init__(self):
        self._client: Optional[AsyncIOMotorClient] = None
        self._db = None

    async def connect(self):
        if not settings.MONGO_URI:
            print("[SessionStore] No MONGO_URI configured — running without persistence")
            return
        self._client = AsyncIOMotorClient(settings.MONGO_URI)
        self._db = self._client.get_default_database("mannmitra")
        await self._ensure_indexes()
        print("[SessionStore] Connected to MongoDB")

    async def _ensure_indexes(self):
        if self._db is None:
            return
        sessions = self._db["chat_sessions"]
        await sessions.create_index("session_id", unique=True)
        await sessions.create_index("user_id")
        await sessions.create_index("risk_level")
        await sessions.create_index("updated_at")

        alerts = self._db["risk_alerts"]
        await alerts.create_index("alert_id", unique=True)
        await alerts.create_index("risk_level")
        await alerts.create_index("created_at")

    async def save_interaction(
        self,
        session_id: str,
        user_message: str,
        bot_reply: str,
        risk_score: int,
        risk_level: str,
        risk_summary: str,
        user_id: Optional[str] = None,
        user_name: Optional[str] = None,
    ):
        if self._db is None:
            return
        sessions = self._db["chat_sessions"]

        set_fields = {
            "user_id": user_id,
            "risk_level": risk_level,
            "risk_score": risk_score,
            "risk_summary": risk_summary,
            "updated_at": datetime.utcnow(),
        }
        if user_name:
            set_fields["user_name"] = user_name

        await sessions.update_one(
            {"session_id": session_id},
            {
                "$set": set_fields,
                "$push": {
                    "messages": {
                        "$each": [
                            {
                                "role": "user",
                                "content": user_message,
                                "timestamp": datetime.utcnow(),
                            },
                            {
                                "role": "assistant",
                                "content": bot_reply,
                                "risk_score": risk_score,
                                "timestamp": datetime.utcnow(),
                            },
                        ]
                    },
                    "mood_scores": {
                        "$each": [risk_score],
                        "$slice": -50,
                    },
                },
                "$inc": {"interaction_count": 1},
                "$setOnInsert": {
                    "created_at": datetime.utcnow(),
                },
            },
            upsert=True,
        )

    async def save_alert(self, alert_data: dict):
        if self._db is None:
            return
        alerts = self._db["risk_alerts"]
        alert_data["created_at"] = datetime.utcnow()
        await alerts.insert_one(alert_data)

    async def get_session(self, session_id: str) -> Optional[dict]:
        if self._db is None:
            return None
        return await self._db["chat_sessions"].find_one(
            {"session_id": session_id}, {"_id": 0}
        )

    async def get_chat_history_turns(self, session_id: str) -> list[dict]:
        """Prior turns for RAG/risk (excludes the message not yet saved for this request)."""
        doc = await self.get_session(session_id)
        if not doc:
            return []
        msgs = normalize_stored_messages(doc.get("messages"))
        return msgs[-settings.MAX_HISTORY_LENGTH :]

    async def get_high_risk_sessions(self, limit: int = 50) -> list[dict]:
        if self._db is None:
            return []
        cursor = (
            self._db["chat_sessions"]
            .find(
                {"risk_level": {"$in": ["high", "critical"]}},
                {"_id": 0, "messages": 0},
            )
            .sort("updated_at", -1)
            .limit(limit)
        )
        return await cursor.to_list(length=limit)

    async def get_recent_alerts(self, limit: int = 50) -> list[dict]:
        if self._db is None:
            return []
        cursor = (
            self._db["risk_alerts"]
            .find({}, {"_id": 0})
            .sort("created_at", -1)
            .limit(limit)
        )
        return await cursor.to_list(length=limit)

    async def get_risk_stats(self) -> dict:
        if self._db is None:
            return {}
        sessions = self._db["chat_sessions"]
        pipeline = [
            {"$group": {
                "_id": "$risk_level",
                "count": {"$sum": 1},
                "avg_score": {"$avg": "$risk_score"},
            }},
        ]
        result = {}
        async for doc in sessions.aggregate(pipeline):
            result[doc["_id"]] = {
                "count": doc["count"],
                "avg_score": round(doc["avg_score"] or 0, 1),
            }
        return result

    async def get_admin_sessions(
        self,
        limit: int = 200,
        include_messages: bool = True,
    ) -> list[dict]:
        if self._db is None:
            return []

        projection = {"_id": 0}
        if not include_messages:
            projection["messages"] = 0

        cursor = (
            self._db["chat_sessions"]
            .find({}, projection)
            .sort("updated_at", -1)
            .limit(limit)
        )
        return await cursor.to_list(length=limit)

    async def close(self):
        if self._client:
            self._client.close()


session_store = SessionStore()
