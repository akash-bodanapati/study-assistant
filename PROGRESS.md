# PROGRESS.md — Study Assistant Build Log

## Status: All P0 milestones complete ✅

### Completed Milestones

| # | Milestone | Key files | Status |
|---|-----------|-----------|--------|
| M1 | Scaffold app shell with mock data flow | `src/App.jsx`, `src/components/`, `src/index.css` | ✅ |
| M2 | Backend AI proxy with structured JSON prompting | `api/generate.js`, `server/index.js` | ✅ |
| M3 | Connect frontend to live endpoint with loading state | `src/utils/api.js`, `src/components/LoadingState.jsx` | ✅ |
| M4 | Response validation + graceful error handling | `src/utils/validate.js`, `src/components/ErrorState.jsx` | ✅ |
| M5 | Stale response prevention (AbortController) | `src/utils/api.js`, `src/App.jsx` | ✅ |
| M6 | Flashcard viewer (flip, navigation, progress) | `src/components/FlashcardViewer.jsx` | ✅ |
| M7 | Quiz mode + grading + retest wrong answers | `src/components/QuizMode.jsx` | ✅ |
| M8 | Empty state + mobile-responsive layout | `src/components/EmptyState.jsx`, `src/App.css` | ✅ |
| M9 | README with setup, AI-usage note, limitations | `README.md` | ✅ |

### Next Steps (P1)

- [ ] **M10** — Deploy to Vercel; add live URL to README
- [ ] **M11** — Screen recording (2–4 min demo)

### How to Run

```bash
# 1. Install deps (already done if you cloned this)
npm install

# 2. Set API key
cp .env.example .env
# Edit .env: GEMINI_API_KEY=your_key_here

# 3. Start everything with ONE command
npm start
# Opens both the Express API server (port 3001) and Vite frontend (port 5173)

# 4. Open http://localhost:5173
```

### Architecture Summary

- **Frontend**: React 18 + Vite, plain CSS, no UI framework
- **Backend**: `api/generate.js` (Vercel serverless fn) + `server/index.js` (local Express mirror, started via `npm start`)  
- **AI**: Google Gemini 2.0 Flash with `responseMimeType: "application/json"` for structured output
- **API key**: Server-side only, read from `process.env.GEMINI_API_KEY` — never touches the browser
- **Stale responses**: `AbortController` in `src/utils/api.js`, cancelled in `App.jsx` on each new submit
- **Validation**: Hand-written in `src/utils/validate.js` — checks types, non-empty arrays, `correctIndex` range

### Automated Test Results (pre-deployment checklist)

Run `node test/manual-checks.js` — 22/22 checks pass:
- ✅ Malformed JSON (wrong shape) → validator rejects
- ✅ Empty arrays (zero cards, zero questions) → rejected
- ✅ `correctIndex` out of range → rejected  
- ✅ Valid response → passes validation
- ✅ API key never in browser-facing JSON
- ✅ `api.js` fetch has no Authorization/key headers
- ✅ Pre-aborted signal → `isCancelled: true` (fast-path)
- ✅ 20s timeout configured in `API_TIMEOUT_MS`
