"""
Vector Store - ChromaDB integration for storing and retrieving
mental health knowledge base embeddings.
"""

import chromadb
from chromadb.api.types import EmbeddingFunction, Documents, Embeddings
from chromadb.config import Settings as ChromaSettings
from typing import Optional
from app.config import settings


class GoogleGeminiEmbeddingFunction(EmbeddingFunction):
    """ChromaDB-compatible embedding function using Google Gemini."""

    def __init__(self, api_key: str, model_name: str = "models/text-embedding-004"):
        self._api_key = api_key
        self._model_name = model_name

    def name(self) -> str:
        return "google-gemini"

    def __call__(self, input: Documents) -> Embeddings:
        from google import genai

        client = genai.Client(api_key=self._api_key)
        results = []
        for text in input:
            response = client.models.embed_content(
                model=self._model_name,
                contents=text,
            )
            results.append(response.embeddings[0].values)
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

        if settings.has_gemini:
            self._embedding_fn = GoogleGeminiEmbeddingFunction(
                api_key=settings.GEMINI_API_KEY,
                model_name=settings.EMBEDDING_MODEL,
            )
        else:
            from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
            self._embedding_fn = SentenceTransformerEmbeddingFunction(
                model_name="all-MiniLM-L6-v2"
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

        self.collection.add(documents=texts, ids=ids, metadatas=metadatas)
        return len(ids)

    def query(
        self,
        query_text: str,
        n_results: int = None,
        severity_filter: Optional[str] = None,
        topic_filter: Optional[str] = None,
    ) -> list[dict]:
        """
        Semantic search against the knowledge base.
        Returns list of {text, metadata, distance}.
        """
        n = n_results or settings.RAG_TOP_K
        where_filter = None

        if severity_filter and topic_filter:
            where_filter = {
                "$and": [
                    {"severity_category": severity_filter},
                    {"topic": topic_filter},
                ]
            }
        elif severity_filter:
            where_filter = {"severity_category": severity_filter}
        elif topic_filter:
            where_filter = {"topic": topic_filter}

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
