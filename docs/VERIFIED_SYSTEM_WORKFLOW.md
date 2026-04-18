# Verified System Workflow - Mann-Mitra

This version is aligned with the implemented codebase and should be used for the PPT explanation.

## 1. User Entry Points

The actual system entry points visible in the code are:
- registration and login
- student dashboard
- screening
- AI chat with Buddy
- forum
- counsellor booking
- admin and counsellor dashboards
- resources and certification pages

## 2. How the System Works

### A. Authentication and Role Access
- Users register or log in through the React frontend.
- The Node.js backend manages JWT authentication and role-based access.
- Roles implemented in the code are student, counsellor, admin, and moderator.

### B. Screening Flow
- Students can submit PHQ-9 and GAD-7 screenings through the Node.js API.
- The frontend currently contains a full PHQ-9 flow, while the backend supports both PHQ-9 and GAD-7.
- Screening results are stored in MongoDB.
- High-risk screenings can be reviewed by counsellors, admins, or moderators.

### C. AI Chat Flow
- The `/chat` page in the React app primarily calls the Buddy FastAPI service.
- Buddy loads session history from MongoDB.
- Buddy runs:
  - RAG retrieval using ChromaDB
  - rule-based risk detection
  - LLM-based clinical risk assessment
  - semantic similarity scoring
- A conservative max ensemble produces the final risk score and level.
- Based on the risk level, Buddy returns a supportive response, coping exercise, counsellor recommendation, or crisis response.

### D. Alert and Dashboard Flow
- If the Buddy risk level is high or critical, Buddy sends an alert to the Node.js server.
- The Node.js server can broadcast alerts through Socket.io.
- The admin/risk dashboard reads alert and session information for monitoring.

### E. Forum Flow
- Users can create forum posts, including anonymous posts.
- The forum backend applies rule-based content filtering for self-harm, violence, profanity, and spam.
- Harmful posts can be flagged or sent to moderation review.
- Severe content can trigger moderation alerts.

### F. Counselling and Booking Flow
- Students can view counsellor availability and create appointments.
- Appointment modes supported in the backend are in-person, tele, chat, and video.
- Students and counsellors can continue conversations through the chat platform linked to appointments.

### G. Resources and Certification Flow
- The frontend includes a resource hub, training courses, certification exam, interview scheduling, and peer-support certification screens.
- These flows are present in the UI and project story, but parts of them are currently demo-style/static rather than deeply connected to backend workflow.

## 3. What Should Be Claimed Carefully in the PPT

These points should be presented carefully because the code only partially supports them:
- `Anonymous, encrypted registration`:
  registration is not fully anonymous; anonymity is mainly for peer-facing display and alert identifiers.
- `AI content moderation`:
  forum moderation is implemented, but content checking is keyword/rule-based rather than a dedicated AI moderation model.
- `Volunteer training modules -> counsellor review -> trained peer supporter`:
  this certification journey exists strongly in the frontend flow, but it is not fully backed by a complete backend workflow.
- `Continuous improvement loop / organization wellness policy improvement`:
  analytics and reports exist, but automatic policy-improvement logic is not implemented as a full closed loop.
- `Multilingual voice chatbot`:
  multilingual support is suggested by UI and language files, and Buddy handles Hindi/Hinglish risk terms, but the visible browser voice-recognition setup is not a full production-grade multilingual voice pipeline.

## 4. PPT-Safe Architecture Description

Use this wording:

Mann-Mitra is a multi-role mental health support platform in which the React frontend provides student, counsellor, admin, and moderator interfaces. The Node.js backend handles authentication, screening, booking, forum, moderation, and dashboard APIs using MongoDB. The Buddy FastAPI microservice handles AI chat, retrieval-augmented response generation, risk assessment, and crisis alerting. ChromaDB stores the vectorized knowledge base used for retrieval, while MongoDB stores operational data, chat sessions, and risk alerts.

## 5. PPT-Safe Working Flow Description

Use this wording:

The user accesses the platform through role-based login and can enter through screening, AI chat, forum, booking, or resource pages. Standard application features are processed by the Node.js backend. Chat requests are processed by Buddy, which combines RAG retrieval and multi-signal risk analysis. Depending on the final risk level, the system returns supportive guidance, counselling recommendation, or crisis escalation. High-risk cases are forwarded for dashboard monitoring and institutional follow-up.
