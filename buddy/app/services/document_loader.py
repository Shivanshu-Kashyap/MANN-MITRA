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
            if topic == "general" and source and (source.endswith(".pdf") or "/" in source or "\\" in source):
                filename_topic = self._topic_from_filename(source)
                if filename_topic:
                    topic = filename_topic

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
            "suicide", "suicidal", "self-harm", "self harm", "crisis intervention",
            "emergency", "overdose", "lethal means", "warning signs of suicide",
            "action steps help someone", "988", "crisis lifeline", "crisis hotline",
            "thoughts of suicide", "suicidal ideation", "frequently asked questions about suicide",
        ]
        high_kw = [
            "severe depression", "severe anxiety", "psychosis",
            "hospitalization", "inpatient", "panic disorder", "panic attack",
            "ptsd", "trauma", "substance abuse", "substance use", "addiction",
            "personality disorder", "borderline", "bpd",
        ]
        medium_kw = [
            "moderate depression", "panic attack", "ptsd",
            "trauma", "substance abuse", "drug use", "preventing drug",
            "generalized anxiety", "social anxiety", "phobia",
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
        """Map content to topic for retrieval; covers all knowledge base criteria."""
        lower = text.lower()
        topic_map = {
            "crisis": [
                "suicide", "suicidal", "self-harm", "self harm", "crisis", "emergency",
                "warning signs", "action steps", "988", "crisis lifeline", "lethal means",
                "frequently asked questions about suicide",
            ],
            "cbt": [
                "cognitive behavioral", "cbt", "thought patterns", "cognitive distortion",
                "behavioral therapy", "cognitive restructuring", "automatic thoughts",
            ],
            "anxiety": [
                "anxiety", "anxious", "worry", "panic", "gad", "panic attack",
                "panic disorder", "generalized anxiety", "social anxiety", "phobia",
            ],
            "depression": [
                "depression", "depressed", "hopeless", "sadness", "phq", "mood",
                "low mood", "major depressive", "depressive disorder",
            ],
            "stress": [
                "stress", "stressed", "burnout", "overwhelm", "pressure",
                "coping with stress", "stress management", "stressed out",
            ],
            "substance_use": [
                "substance", "drug use", "drug abuse", "alcohol", "addiction",
                "preventing drug", "substance use disorder", "recovery",
            ],
            "personality_disorders": [
                "personality disorder", "borderline", "bpd", "narcissistic",
                "avoidant", "dependent", "cluster", "dialectical",
            ],
            "mindfulness": [
                "mindfulness", "meditation", "breathing", "grounding",
                "relaxation", "coloring", "activity book", "calm",
            ],
            "self_care": [
                "self-care", "self care", "sleep", "exercise", "nutrition",
                "hygiene", "routine", "healthy habits", "wellness",
            ],
            "relationships": [
                "relationship", "social", "loneliness", "isolation",
                "support system", "connection", "interpersonal",
            ],
            "mental_health_general": [
                "mental health", "wellbeing", "well-being", "psychological",
                "emotional health", "counseling", "therapy", "treatment",
            ],
        }
        for topic, keywords in topic_map.items():
            if any(k in lower for k in keywords):
                return topic
        return "general"

    @staticmethod
    def _topic_from_filename(file_path: str) -> Optional[str]:
        """Infer topic from filename for better metadata (e.g. database PDFs)."""
        name = Path(file_path).stem.lower()
        if "suicide" in name or "suicid" in name or "crisis" in name:
            return "crisis"
        if "depression" in name or "depress" in name:
            return "depression"
        if "anxiety" in name or "panic" in name:
            return "anxiety"
        if "stress" in name or "stressed" in name:
            return "stress"
        if "cbt" in name or "cognitive" in name:
            return "cbt"
        if "personality" in name or "disorder" in name:
            return "personality_disorders"
        if "drug" in name or "substance" in name or "preventing" in name:
            return "substance_use"
        if "mental" in name and "health" in name:
            return "mental_health_general"
        return None


document_loader = DocumentLoader()
