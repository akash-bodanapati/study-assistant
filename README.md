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

This runs both the Express API server (port 3001) and Vite frontend (port 5173) simultaneously. Open [http://localhost:5173](http://localhost:5173) in your browser.

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

## 🧪 Testing & Verification

Run the automated test suite covering validation edge cases, AbortController stale cancellation, timeout handling, keyboard nav, and accessibility:

```bash
# Run complete check suite (28/28 tests)
node test/manual-checks.js

# Run individual test scripts
node test/test-empty-state.js
node test/test-stale-response-trigger.js
node test/test-malformed-response-trigger.js
node test/test-quiz-keyboard.js
node test/test-accessibility.js
```

---

## 🤖 Honest AI-Usage Note

This project was developed with the assistance of an AI coding agent (**Antigravity**, powered by Google DeepMind models) working under human pair-programming direction:

- **Human Guidance & Decisions**:
  - Directed the overall milestone plan, component architecture, and UI aesthetic requirements.
  - Specified key bug fixes (e.g., identifying the flashcard flip-state transition leak, requesting exact keyboard shortcut bindings for the quiz, and defining abort error classification behavior).
  - Selected and verified model configuration (`gemini-3.5-flash-lite`).
- **AI Agent Execution**:
  - Scaffolded React/Vite components, CSS design system, and backend Express proxy.
  - Implemented `validate.js` schema validation and `api.js` AbortController logic.
  - Authored automated test scripts in `test/`.

All code has been reviewed, tested, and verified for correctness.

---

## ⚠️ Known Limitations

1. **AI Output Quantity**: Gemini occasionally returns slightly fewer than the requested 8 flashcards or 6 quiz questions. The app gracefully renders whichever valid items are returned.
2. **No Persistence**: Study sets are held in React state and reset on page refresh.
3. **English Optimization**: Prompts are tuned for English text inputs. Non-English notes may yield mixed-language output.
4. **Free-Tier Quotas**: Heavy request volume may encounter Gemini free-tier rate limits (HTTP 429). The app surfaces a clear rate-limit message allowing the user to retry after ~60 seconds.
