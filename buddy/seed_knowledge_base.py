"""
Seed the ChromaDB knowledge base with sample mental health documents.
Run once: python seed_knowledge_base.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from app.config import settings
from app.services.document_loader import document_loader
from app.services.vector_store import vector_store


def seed():
    print("=" * 50)
    print("  Seeding Knowledge Base")
    print("=" * 50)

    vector_store.initialize()
    current_count = vector_store.get_stats()["total_documents"]
    print(f"Current documents in vector store: {current_count}")

    if current_count > 0:
        print("Knowledge base already has documents. Skipping seed.")
        print("To re-seed, delete the chroma_db folder and run again.")
        return

    kb_path = os.path.join(os.path.dirname(__file__), "knowledge_base", "sample_documents")
    if not os.path.isdir(kb_path):
        print(f"No sample documents found at {kb_path}")
        return

    docs = document_loader.load_directory(kb_path)
    print(f"Loaded {len(docs)} chunks from sample documents")

    if docs:
        count = vector_store.add_documents(docs)
        print(f"Added {count} chunks to ChromaDB")

    final = vector_store.get_stats()
    print(f"Final document count: {final['total_documents']}")
    print("Seed complete!")


if __name__ == "__main__":
    seed()
