"""
Document Loader - Ingests PDFs/text files, chunks them, and adds metadata
for the mental health knowledge base.
"""

import os
import re
from pathlib import Path
from typing import Optional
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.config import settings


class DocumentLoader:
    def __init__(self):
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP,
            separators=["\n\n", "\n", ". ", " ", ""],
            length_function=len,
        )

    def load_pdf(self, file_path: str, metadata: Optional[dict] = None) -> list[dict]:
        """Load a PDF and return chunked documents with metadata."""
        from pypdf import PdfReader

        reader = PdfReader(file_path)
        full_text = ""
        for page in reader.pages:
            text = page.extract_text() or ""
            full_text += text + "\n\n"

        return self._chunk_text(full_text, source=file_path, extra_metadata=metadata)

    def load_text(self, text: str, source: str = "manual", metadata: Optional[dict] = None) -> list[dict]:
        """Chunk raw text into documents."""
        return self._chunk_text(text, source=source, extra_metadata=metadata)

    def load_directory(self, dir_path: str) -> list[dict]:
        """Recursively load all PDFs and text files from a directory."""
        documents = []
        path = Path(dir_path)

        for file in path.rglob("*"):
            if file.suffix.lower() == ".pdf":
                documents.extend(self.load_pdf(str(file)))
            elif file.suffix.lower() in (".txt", ".md"):
                content = file.read_text(encoding="utf-8", errors="ignore")
                documents.extend(
                    self.load_text(content, source=str(file))
                )

        return documents

    def _chunk_text(self, text: str, source: str, extra_metadata: Optional[dict] = None) -> list[dict]:
        """Clean, chunk, and attach metadata to text."""
        cleaned = self._clean_text(text)
        if not cleaned.strip():
            return []

        chunks = self.splitter.split_text(cleaned)
        documents = []

        for i, chunk in enumerate(chunks):
            severity = self._detect_severity_category(chunk)
            topic = self._detect_topic(chunk)

            meta = {
                "source": source,
                "chunk_index": i,
                "total_chunks": len(chunks),
                "severity_category": severity,
                "topic": topic,
            }
            if extra_metadata:
                meta.update(extra_metadata)

            documents.append({"text": chunk, "metadata": meta})

        return documents

    @staticmethod
    def _clean_text(text: str) -> str:
        text = re.sub(r"\s+", " ", text)
        text = re.sub(r"[^\x20-\x7E\n]", "", text)
        return text.strip()

    @staticmethod
    def _detect_severity_category(text: str) -> str:
        """Heuristic severity tagger based on content keywords."""
        lower = text.lower()
        critical_kw = [
            "suicide", "suicidal", "self-harm", "crisis intervention",
            "emergency", "overdose", "lethal means",
        ]
        high_kw = [
            "severe depression", "severe anxiety", "psychosis",
            "hospitalization", "inpatient",
        ]
        medium_kw = [
            "moderate depression", "panic attack", "ptsd",
            "trauma", "substance abuse",
        ]

        if any(k in lower for k in critical_kw):
            return "critical"
        if any(k in lower for k in high_kw):
            return "high"
        if any(k in lower for k in medium_kw):
            return "medium"
        return "low"

    @staticmethod
    def _detect_topic(text: str) -> str:
        lower = text.lower()
        topic_map = {
            "cbt": ["cognitive behavioral", "cbt", "thought patterns", "cognitive distortion"],
            "anxiety": ["anxiety", "anxious", "worry", "panic", "gad"],
            "depression": ["depression", "depressed", "hopeless", "sadness", "phq"],
            "stress": ["stress", "burnout", "overwhelm", "pressure"],
            "crisis": ["crisis", "suicide", "self-harm", "emergency"],
            "mindfulness": ["mindfulness", "meditation", "breathing", "grounding"],
            "self_care": ["self-care", "sleep", "exercise", "nutrition", "hygiene"],
            "relationships": ["relationship", "social", "loneliness", "isolation"],
        }
        for topic, keywords in topic_map.items():
            if any(k in lower for k in keywords):
                return topic
        return "general"


document_loader = DocumentLoader()
