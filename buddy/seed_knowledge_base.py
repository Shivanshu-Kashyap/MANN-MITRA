"""
Seed the ChromaDB knowledge base with mental health documents.
Loads from both sample_documents (txt/md) and database (PDFs).
Run: python seed_knowledge_base.py
Re-seed (replace existing): python seed_knowledge_base.py --force
"""

import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from app.config import settings
from app.services.document_loader import document_loader
from app.services.vector_store import vector_store


def seed(force: bool = False):
    print("=" * 50)
    print("  Seeding Knowledge Base")
    print("=" * 50)
    print(
        f"  EMBEDDING_BACKEND={settings.EMBEDDING_BACKEND!r} "
        f"(local={'yes' if settings.use_local_embeddings else 'no'}) — "
        "set EMBEDDING_BACKEND=local in .env for fastest indexing.",
        flush=True,
    )

    vector_store.initialize()
    current_count = vector_store.get_stats()["total_documents"]
    print(f"Current documents in vector store: {current_count}")

    if current_count > 0 and not force:
        print("Knowledge base already has documents. Skipping seed.")
        print("To re-seed, run: python seed_knowledge_base.py --force")
        return

    if force and current_count > 0:
        print("Force re-seed: clearing existing collection...")
        vector_store.clear()
        vector_store.initialize()

    base = os.path.join(os.path.dirname(__file__), "knowledge_base")
    all_docs = []

    sample_path = os.path.join(base, "sample_documents")
    if os.path.isdir(sample_path):
        docs_sample = document_loader.load_directory(sample_path)
        all_docs.extend(docs_sample)
        print(f"Loaded {len(docs_sample)} chunks from sample_documents")

    database_path = os.path.join(base, "database")
    if os.path.isdir(database_path):
        docs_db = document_loader.load_directory(database_path)
        all_docs.extend(docs_db)
        print(f"Loaded {len(docs_db)} chunks from database (PDFs)")

    if not all_docs:
        print("No documents found in knowledge_base/sample_documents or knowledge_base/database")
        return

    count = vector_store.add_documents(all_docs)
    print(f"Added {count} chunks to ChromaDB")

    final = vector_store.get_stats()
    print(f"Final document count: {final['total_documents']}")
    print("Seed complete! Model will now respond using this knowledge base.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed ChromaDB with mental health knowledge base")
    parser.add_argument("--force", action="store_true", help="Clear existing data and re-seed")
    args = parser.parse_args()
    seed(force=args.force)
