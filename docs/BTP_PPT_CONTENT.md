# Final BTP PPT Content - Mann-Mitra

## Slide 1 - Title Slide

**Topic:** Mann-Mitra: AI-Enabled Mental Health Support Platform for Institutions  
**Presented by:** [Your Name]  
**Under the Guidance of:** [Supervisor Name]

---

## Slide 2 - Introduction, Motivation & Literature Gap

### Introduction
- Mental health issues such as stress, anxiety, depression, and crisis situations are increasing among students.
- In many institutions, students hesitate to approach counsellors because of stigma, delay, or lack of immediate support.
- Mann-Mitra is a digital mental health support platform that combines self-screening, AI-assisted conversation, counsellor booking, and institutional monitoring.

### Motivation
- Provide immediate and accessible first-level mental health support.
- Detect high-risk and crisis-related conversations early.
- Connect students with counsellors through a single platform.
- Support institutions with dashboards, alerts, and safe follow-up workflows.

### Literature Gap
- Many existing systems provide only static resources or simple chat support.
- Traditional chatbots usually lack retrieval-based domain knowledge and structured risk scoring.
- Most platforms do not integrate screening, counselling, admin monitoring, and crisis alerting in one workflow.
- Existing keyword-only risk systems may miss context, while generic AI systems may not provide transparent risk reasoning.

---

## Slide 3 - Problem Statement & Objectives

### Problem Statement
Institutions need a safe and scalable platform that can offer mental health assistance, identify distress and crisis signals from user conversations, guide users with relevant support, and escalate serious cases to counsellors or administrators when required.

### Objectives
- Build a role-based mental health support platform for students, counsellors, and admins.
- Provide self-screening support using PHQ-9 and GAD-7 based workflows.
- Develop an AI chat assistant with Retrieval-Augmented Generation using a mental health knowledge base.
- Design a multi-signal risk detection module for low, medium, high, and critical risk classification.
- Enable counselling recommendation, session booking, and admin alert generation for serious cases.

---

## Slide 4 - Proposed Solution / Methodology

### Proposed Solution
Mann-Mitra is built as a three-part system:
- React frontend for students, counsellors, and admins
- Node.js backend for authentication, booking, screening, forum, dashboards, and real-time communication
- Buddy FastAPI service for AI chat, RAG-based response generation, risk scoring, and crisis alerts

### Methodology
1. User interacts through the React web application.
2. General platform features are handled by the Node.js API with MongoDB.
3. Chat requests are sent to Buddy.
4. Buddy retrieves relevant knowledge from ChromaDB and generates a grounded response.
5. In parallel, Buddy performs multi-signal risk assessment:
   - Rule-based keyword analysis
   - LLM-based clinical triage
   - Semantic similarity scoring
6. Final risk is computed using a conservative max ensemble.
7. Based on risk level, the system returns:
   - supportive response,
   - coping exercise,
   - counsellor recommendation,
   - or crisis escalation and admin alert.

---

## Slide 5 - System Architecture

### Architecture Explanation
- The frontend provides separate workflows for students, counsellors, and admins.
- The Node.js server manages authentication, appointments, screening records, forum, and dashboard APIs.
- The Buddy service handles AI conversation, retrieval from the knowledge base, risk scoring, and alert generation.
- MongoDB stores users, sessions, appointments, screenings, and alerts.
- ChromaDB stores embedded mental health knowledge chunks for semantic retrieval.

### Use the architecture diagram created for:
- overall platform flow
- integration between frontend, Node.js server, Buddy, MongoDB, and ChromaDB

---

## Slide 6 - Detailed Working / Algorithm

### Chat and Risk Detection Workflow
1. User sends a message from the chat interface.
2. Buddy loads previous conversation history from MongoDB.
3. Rule-based detector analyzes crisis, self-harm, anxiety, panic, repetition, and history signals.
4. Buddy simultaneously:
   - generates a RAG response using knowledge-base retrieval
   - performs LLM-based clinical risk assessment
5. Semantic similarity module compares the message with curated crisis and distress reference phrases.
6. Ensemble risk scorer computes:
   - `final_score = max(rule_score, llm_score, semantic_score)`
7. Hard overrides are applied for explicit crisis keywords or strong suicidal intent.
8. Decision engine maps the final score to:
   - Low: self-help support
   - Medium: coping strategies and optional counselling
   - High: strong counselling recommendation and alert
   - Critical: crisis response, helplines, and immediate alert

### Key Design Choice
- Conservative max ensemble is used because in mental health systems, missing a high-risk user is more dangerous than producing a false positive.

---

## Slide 7 - Results, Analysis & Demo

### Results
- The platform successfully integrates:
  - student support features,
  - AI chat,
  - screening,
  - counsellor booking,
  - admin monitoring,
  - and crisis alert support.
- Buddy produces grounded responses using retrieval from a curated mental health knowledge base.
- The risk engine does not rely on a single method; it combines rule-based, LLM-based, and semantic signals.
- High and critical risk conversations trigger stronger intervention logic and alert generation.

### Analysis
- The use of RAG improves relevance compared to a generic chatbot.
- Multi-signal scoring improves safety over only keyword-based detection.
- The system is robust because if the LLM risk scorer is unavailable, rule-based and semantic scoring still continue.
- Separation of frontend, platform backend, and AI microservice makes the system modular and scalable.

### Demo Screenshots to Include
- Student dashboard
- Screening page
- Buddy chat interface
- Chat response with coping exercise / counsellor recommendation
- High-risk or critical-risk response flow
- Admin risk dashboard or alert view

---

## Slide 8 - Conclusion & Future Scope

### Conclusion
- Mann-Mitra is a complete institutional mental health support platform.
- It combines screening, AI-assisted support, knowledge-grounded response generation, risk assessment, and escalation support in one system.
- The project improves accessibility, early risk identification, and connection between students and professional support services.

### Future Scope
- Add multilingual voice-first counselling support.
- Improve personalization using long-term mood and session trends.
- Introduce appointment prioritization based on risk severity.
- Expand the knowledge base with institution-specific wellness resources.
- Add stronger analytics for early intervention and counsellor workload planning.

---

## Slide 9 - Demo Note

For the Results, Analysis & Demo slide, use screenshots from the running system for:
- `/dashboard`
- `/screening`
- `/chat`
- `/booking`
- `/admin/dashboard`

If needed, place the architecture diagram before the methodology slide and the risk workflow diagram before the results slide.
