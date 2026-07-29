# 📚 Study Assistant

> **AI-powered flashcard and quiz generator** — paste your notes or type a topic, and instantly get interactive study materials. Built with React, Vite, Express, and Google Gemini AI.

---

## ✨ Key Features

- **AI Flashcard & Quiz Generation**: Produces topic-specific flashcards and a multiple-choice quiz from free-form text.
- **3D Flip Interaction**: Click or press `Space`/`Enter` on a flashcard to flip between Question and Answer faces.
- **Graded Quiz Mode**: Multiple-choice quiz with per-question explanations shown immediately after answering.
- **Retest Wrong Answers**: Dedicated flow that lets users re-quiz only the questions they answered incorrectly.
- **Single-Command Execution**: One `npm start` command launches both the Express backend API proxy and Vite frontend via `concurrently`.
- **Keyboard Navigation**:
  - Flashcards: `Space` / `Enter` to flip; `ArrowLeft` / `ArrowRight` to navigate.
  - Quiz: `1–4` or `A–D` to select options; `Enter` / `Space` / `ArrowRight` to advance; `ArrowLeft` to go back.
- **Robust Error Handling**: Friendly error cards with Retry buttons for timeouts (20s client-side limit) and malformed AI outputs.
- **Stale Response Protection**: Uses `AbortController` to cancel in-flight requests when a new topic is submitted, preventing older responses from overwriting newer UI state.
- **Mobile Responsive**: Fully responsive layout tailored for narrow mobile viewports (375px+).

---

## 🚀 Setup & Running Locally

### Prerequisites

- Node.js 18+ and npm
- A free [Google Gemini API key](https://aistudio.google.com/app/apikey)

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and insert your Gemini API key:

```bash
cp .env.example .env
```

Open `.env` and set:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

> ⚠️ **Security Notice**: `.env` is gitignored. The API key is read strictly server-side by the backend proxy (`api/generate.js` / `server/index.js`) and is **never** sent to or exposed in the browser.

### 3. Run the App (Single Command)

```bash
npm start
```

This runs both the Express API server (port 3001) and Vite frontend (port 5173) simultaneously via `concurrently`. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🏗️ Architecture & Data Flow

```
Browser (React 18 + Vite, Port 5173)
    │
    │  POST /api/generate { text: string }
    │  (Vite dev proxy → Express server on port 3001 in dev)
    │  (Vercel Serverless Function in production)
    ▼
Backend Proxy (api/generate.js / server/index.js)
    │  Reads GEMINI_API_KEY from process.env — never sent to browser
    │  Calls Gemini model (gemini-3.5-flash-lite) with responseMimeType: "application/json"
    │  Returns JSON or { error: "..." }
    ▼
Google Gemini API (gemini-3.5-flash-lite)
```

### JSON Contract

The backend and frontend communicate using this structured JSON shape:

```json
{
  "topic": "Photosynthesis",
  "flashcards": [
    { "id": "fc-1", "front": "What organelle performs photosynthesis?", "back": "Chloroplast" }
  ],
  "quiz": [
    {
      "id": "q-1",
      "question": "What gas do plants absorb during photosynthesis?",
      "options": ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"],
      "correctIndex": 1,
      "explanation": "Plants take in CO2 through stomata to produce glucose."
    }
  ]
}
```

---

## ⏱️ Time Spent

| Phase / Milestone | Description | Approx. Time |
|-------------------|-------------|--------------|
| **Scaffolding & Backend Proxy** | Vite project setup, Express dev server, Vite proxy config, Gemini SDK integration, `.env` wiring | ~45 min |
| **Validation & Stale-Response Protection** | Hand-written `validate.js` contract checks (all field types, `correctIndex` range, empty-array detection), `AbortController` stale-response cancellation, 20s client-side timeout with distinct error classification | ~45 min |
| **UI Components & State Machine** | Flashcard 3D flip viewer, Quiz mode with per-question grading and retest flow, empty / loading / error states, tab-panel persistent mounting | ~70 min |
| **Model Deprecation Debugging** | Diagnosing 429 / 404 errors from retired Gemini model strings; identifying and switching to a working model; verifying structured JSON output mode still functional | ~30 min |
| **Bug Fixes (3 real bugs)** | Flashcard flip-state leaking into next-card animation (keyed sub-component fix); timeout vs stale-response AbortError misclassification (dual-signal detection); Space-key triggering nav buttons after mouse click (global keydown + blur fix) | ~45 min |
| **Quiz Tab-Switch State Loss** | Diagnosing quiz state reset on tab switch (conditional unmount); fix via persistent `hidden`/`display` mounting; retest-mode and score persistence verified | ~25 min |
| **AI Honesty & Gibberish Prompt** | Multiple rounds of system prompt iteration: topic-disclosure rule for future/unverified events, gibberish fallback to study strategies, prohibition on meta-questions about input strings; manual testing of edge cases | ~35 min |
| **Mobile Responsiveness Audit** | Full pass at 375–414px viewport: input panel, flashcard viewer (flip animation), all 4 quiz options, results/retest screen; overflow fixes, min-height touch targets | ~30 min |
| **Keyboard Navigation & Accessibility** | Quiz `1–4` / `A–D` / `Enter` / `Space` / `ArrowLeft` / `ArrowRight` shortcuts; flashcard `Space` global listener; `aria-*` roles and labels throughout; focus-visible outlines | ~25 min |
| **Testing & Documentation** | Node verification test suite (8 scripts), README.md, DECISIONS.md, 27-item final requirements audit | ~40 min |
| **Total Time** | | **~6.3 hours (approx.)** |

---

## 🤖 Honest AI-Usage Note

This project was developed through human-directed pair programming with an AI coding agent (**Antigravity**):

- **Human Direction & Decisions**:
  - Defined product requirements, state machine design, and architectural constraints.
  - Identified edge-case bugs during manual testing (e.g., flashcard flip-state transition leak, `AbortController` error classification, Space-key button focus collision, quiz tab-switch unmounting, and alphanumeric token fallback).
  - Selected and configured `gemini-3.5-flash-lite` for structured output.
  - Drove all debugging sessions: model deprecation errors, timeout misclassification, Space-key conflict, quiz persistence loss.
- **AI Agent Execution**:
  - Implemented React functional components (`App.jsx`, `FlashcardViewer.jsx`, `QuizMode.jsx`, etc.).
  - Authored Express server proxy (`server/index.js` / `api/generate.js`) and CSS design system (`App.css` / `index.css`).
  - Created automated Node verification test scripts in `test/`.

All code has been reviewed, tested, and empirically verified.

---

## ⚠️ Known Limitations

1. **AI Content Quality for Ambiguous Inputs (understood, correctly-scoped limitation)**: The app handles all JSON parsing, structural validation, and error states robustly — malformed or wrong-shape JSON from the AI is always caught server-side and client-side, and never reaches the UI or causes a crash. This limitation concerns *content fidelity only*: for genuinely ambiguous inputs (e.g., a string that looks like a real word but has no academic meaning, or a topic at the edge of the model's training), the AI may generate plausible-sounding but generic or mildly inaccurate flashcards without flagging the uncertainty. The system prompt instructs Gemini to fall back to study-strategy content for gibberish and to disclose topic pivots for future/unverified events. This measurably improved — though did not perfectly eliminate — the behavior. A fully deterministic guarantee would require a secondary validation layer or ground-truth lookup; this is a clear next iteration rather than something prompt engineering alone can solve.
2. **AI Output Quantity**: Gemini occasionally returns slightly fewer than the requested 8 flashcards or 6 quiz questions. The app gracefully renders whichever valid items are returned (validation requires at least 1 of each).
3. **Session-Only Persistence**: Study sets and quiz results are held in React component state and reset upon full browser page refresh.
4. **English Optimization**: Prompts are tuned for English text inputs. Non-English notes may yield mixed-language output.
5. **Free-Tier Quotas**: Heavy request volume may encounter Gemini free-tier rate limits (HTTP 429). The app surfaces a clear rate-limit message allowing the user to retry after ~60 seconds.
