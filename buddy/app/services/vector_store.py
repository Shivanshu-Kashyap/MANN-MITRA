"""
Vector Store - ChromaDB integration for storing and retrieving
mental health knowledge base embeddings.
"""

import time
import chromadb
from chromadb.api.types import EmbeddingFunction, Documents, Embeddings
from chromadb.config import Settings as ChromaSettings
from typing import Optional
from app.config import settings

# Gemini free tier: 100 embed requests per minute — throttle to avoid 429
EMBED_REQUESTS_PER_MINUTE = 100
EMBED_DELAY_PER_REQUEST_SEC = 60.0 / (EMBED_REQUESTS_PER_MINUTE - 5)  # ~0.63s between calls
EMBED_RETRY_DELAY_SEC = 22
# Smaller add batches = less RAM and partial progress if process dies mid-seed
ADD_DOCUMENT_BATCH_SIZE = 200


class GoogleGeminiEmbeddingFunction(EmbeddingFunction):
    """ChromaDB-compatible embedding function using Google Gemini.
    Batches requests and rate-limits to stay under free-tier quota (100/min).
    """

    def __init__(self, api_key: str, model_name: str = "models/text-embedding-004"):
        self._api_key = api_key
        self._model_name = model_name

    def name(self) -> str:
        return "google-gemini"

    def __call__(self, input: Documents) -> Embeddings:
        from google import genai
        from google.genai import errors as genai_errors

        client = genai.Client(api_key=self._api_key)
        results = []
        for i, text in enumerate(input):
            for attempt in range(4):
                try:
                    response = client.models.embed_content(
                        model=self._model_name,
                        contents=text,
                    )
                    results.append(response.embeddings[0].values)
                    break
                except genai_errors.ClientError as e:
                    if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                        print(
                            f"  [VectorStore] Rate limit (429), waiting {EMBED_RETRY_DELAY_SEC}s "
                            f"(chunk {i + 1}/{len(input)})...",
                            flush=True,
                        )
                        time.sleep(EMBED_RETRY_DELAY_SEC)
                        continue
                    raise
            if (i + 1) % 10 == 0 or (i + 1) == len(input):
                print(f"  [VectorStore] Embedded {i + 1}/{len(input)} chunks...", flush=True)
            time.sleep(EMBED_DELAY_PER_REQUEST_SEC)
        return results


class VectorStore:
    def __init__(self):
        self._client: Optional[chromadb.ClientAPI] = None
        self._collection = None
        self._embedding_fn = None

    def initialize(self):
        """Set up ChromaDB client and collection."""
        self._client = chromadb.PersistentClient(
            path=str(settings.chroma_path),
            settings=ChromaSettings(anonymized_telemetry=False),
        )

        if settings.use_local_embeddings:
            from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction

            self._embedding_fn = SentenceTransformerEmbeddingFunction(
                model_name="all-MiniLM-L6-v2"
            )
            print(
                "[VectorStore] Embeddings: local (SentenceTransformer all-MiniLM-L6-v2) — fast, no API limits.",
                flush=True,
            )
        else:
            self._embedding_fn = GoogleGeminiEmbeddingFunction(
                api_key=settings.GEMINI_API_KEY,
                model_name=settings.EMBEDDING_MODEL,
            )
            print(
                "[VectorStore] Embeddings: Gemini (rate-limited on free tier; set EMBEDDING_BACKEND=local for fast seed).",
                flush=True,
            )

        self._collection = self._client.get_or_create_collection(
            name=settings.CHROMA_COLLECTION_NAME,
            embedding_function=self._embedding_fn,
            metadata={"hnsw:space": "cosine"},
        )
        print(f"[VectorStore] Collection '{settings.CHROMA_COLLECTION_NAME}' ready — {self._collection.count()} docs")

    @property
    def collection(self):
        if self._collection is None:
            self.initialize()
        return self._collection

    def add_documents(self, documents: list[dict]) -> int:
        """
        Add chunked documents to the collection.
        Each doc: {"text": str, "metadata": dict}
        """
        if not documents:
            return 0

        ids = []
        texts = []
        metadatas = []

        base = self.collection.count()
        for i, doc in enumerate(documents):
            doc_id = f"doc_{base + i}"
            ids.append(doc_id)
            texts.append(doc["text"])
            metadatas.append(doc.get("metadata", {}))

        total = len(ids)
        for start in range(0, total, ADD_DOCUMENT_BATCH_SIZE):
            end = min(start + ADD_DOCUMENT_BATCH_SIZE, total)
            self.collection.add(
                documents=texts[start:end],
                ids=ids[start:end],
                metadatas=metadatas[start:end],
            )
            print(
                f"  [VectorStore] Saved {end}/{total} chunks to ChromaDB...",
                flush=True,
            )
        return len(ids)

    @staticmethod
    def _build_where(
        severity_filter: Optional[str],
        topic_filter: Optional[str],
    ) -> Optional[dict]:
        if severity_filter and topic_filter:
            return {
                "$and": [
                    {"severity_category": severity_filter},
                    {"topic": topic_filter},
                ]
            }
        if severity_filter:
            return {"severity_category": severity_filter}
        if topic_filter:
            return {"topic": topic_filter}
        return None

    def _query_raw(
        self,
        query_text: str,
        n: int,
        where_filter: Optional[dict],
    ) -> list[dict]:
        try:
            results = self.collection.query(
                query_texts=[query_text],
                n_results=n,
                where=where_filter,
                include=["documents", "metadatas", "distances"],
            )
        except Exception:
            results = self.collection.query(
                query_texts=[query_text],
                n_results=n,
                include=["documents", "metadatas", "distances"],
            )
        items = []
        if results and results["documents"] and results["documents"][0]:
            for text, meta, dist in zip(
                results["documents"][0],
                results["metadatas"][0],
                results["distances"][0],
            ):
                items.append({"text": text, "metadata": meta, "distance": dist})
        return items

    def query(
        self,
        query_text: str,
        n_results: int = None,
        severity_filter: Optional[str] = None,
        topic_filter: Optional[str] = None,
        allow_topic_fallback: bool = False,
    ) -> list[dict]:
        """
        Semantic search against the knowledge base.
        Returns list of {text, metadata, distance}.

        KB chunks are tagged by *content* severity/topic, not the user's live risk level.
        When allow_topic_fallback is True (chat RAG), if a topic filter returns too few
        hits—e.g. user message maps to "anxiety" but chunks are tagged "general"—we retry
        without the topic filter, matching plain RetrievalQA-style semantic search.
        """
        n = n_results or settings.RAG_TOP_K
        where_filter = self._build_where(severity_filter, topic_filter)
        items = self._query_raw(query_text, n, where_filter)

        if allow_topic_fallback and topic_filter and len(items) < 2:
            relaxed = self._build_where(severity_filter, None)
            items = self._query_raw(query_text, n, relaxed)
        if allow_topic_fallback and len(items) < 2:
            items = self._query_raw(query_text, n, None)

        return items

    def get_stats(self) -> dict:
        count = self.collection.count()
        return {
            "total_documents": count,
            "collection_name": settings.CHROMA_COLLECTION_NAME,
            "persist_dir": str(settings.chroma_path),
        }

    def clear(self):
        """Delete all documents from the collection."""
        if self._client:
            self._client.delete_collection(settings.CHROMA_COLLECTION_NAME)
            self.initialize()


vector_store = VectorStore()
