# 🛠️ Architectural Decisions & Bug Fix Log

> **Study Assistant** — AI-Powered Flashcard & Quiz Generator

---

## 🏗️ Architectural Decisions

### 1. Single-Command Developer Workflow (`npm start`)
- **Problem**: The frontend Vite dev server runs on port 5173, while the backend API proxy (mirroring the Vercel Serverless Function) runs on Express (port 3001). Requiring two terminal windows complicates evaluation.
- **Decision**: Added `concurrently` to `package.json` under `"start": "concurrently --kill-others-on-fail --names \"API,UI\" --prefix-colors \"cyan,magenta\" \"node server/index.js\" \"vite\""`. A single `npm start` launches both processes concurrently with color-coded logging.

### 2. Strict API Key Isolation
- **Decision**: The Google Gemini API key is read strictly from `process.env.GEMINI_API_KEY` inside `api/generate.js` (and `server/index.js` for local development). No API keys or authorization headers are ever exposed to or transmitted by the browser client. `.env` is gitignored; `.env.example` provides documentation.

### 3. Two-Layer Validation Strategy
- **Layer 1 (Backend proxy)**: Light sanity check confirming parsed output is a non-null object containing `flashcards` and `quiz` arrays.
- **Layer 2 (Frontend `validate.js`)**: Deep structural validation verifying:
  - `topic` is a non-empty string.
  - `flashcards` is a non-empty array with valid `{ id, front, back }` string fields.
  - `quiz` is a non-empty array with valid `{ id, question, options, correctIndex, explanation }` fields.
  - `correctIndex` is an integer strictly within `[0, options.length - 1]`.
- **Rationale**: LLMs using structured JSON mode can still occasionally emit schema violations (e.g., `correctIndex = 5` for a 4-option question). Catching this at runtime prevents React rendering crashes and displays a friendly Retry UI card instead.

### 4. AI Honesty & Topic Disclosure (Specific vs Unknown Topics)
- **Problem**: When asked about specific recent, future, or unverified events (e.g., "IPL 2026"), LLMs often generate general background content while still reusing the specific topic title ("IPL 2026"), falsely implying the output directly answers the specific event.
- **Decision**: Updated system prompt instructions in `api/generate.js` to distinguish two input cases:
  - **(a) Specific/Future/Unverified Topics** (e.g., "IPL 2026", "2028 Election Results"): The model generates foundational concepts it DOES know confidently, but MUST explicitly disclose this shift by appending `" (General Overview)"` to the `"topic"` label (e.g., `"IPL (General Overview)"`).
  - **(b) Gibberish/Meaningless Input** (e.g., `"asdfghjkl123"`): The model sets `"topic"` to `"General Study Set"` with learning strategies, without adding disclosure tags.

---

## 🐛 Real Bugs Found & Resolved During Development

### Bug 1: Model Deprecation & Selection
- **Issue**: Initial model configuration targeted `gemini-2.0-flash`, which experienced rate-limiting quota limits during testing.
- **Fix**: Upgraded model configuration in `api/generate.js` to `gemini-3.5-flash-lite`, ensuring reliable structured JSON output generation (`responseMimeType: "application/json"`).

### Bug 2: Flashcard Flip-State & Transition Leakage
- **Issue**: When a card was flipped to the Answer side (`isFlipped = true`), clicking "Next" caused the card to briefly display the *next* card's answer while animating back to the question side.
- **Root Cause**: React was mutating the existing `.flashcard-card` DOM element in-place. Removing the `.flipped` class triggered CSS `transition: transform 0.55s`, animating `rotateY(180deg)` back to `0deg`. Since the DOM text had already updated to Card 2, the back face displayed Card 2's answer during the initial frames of the rotation.
- **Fix**: Extracted card rendering into a `FlashcardCard` sub-component keyed by `key={current.id || currentIndex}`. When navigating cards, React unmounts the old DOM element and mounts a brand-new element with `isFlipped = false` from frame 0. Because it is a newly inserted DOM node without `.flipped`, no CSS transition occurs and the new card appears immediately on its question face without any flash of answer text.

### Bug 3: Error Message Classification (Timeout vs Stale-Response Abort)
- **Issue**: When a request hit the 20-second timeout, `fetch` was cancelled by `AbortController`, but the UI displayed a generic `'Network error: unknown error'` card instead of the timeout-specific message.
- **Root Cause**: `fetch` rejects with a primitive string reason or custom DOMException when aborted. Checking `err.name === 'AbortError'` failed for non-standard reason objects, causing `catch (err)` to fall through to `err.message || 'unknown error'`.
- **Fix**: Refactored `api.js` to inspect both signals and abort reasons:
  - **Stale-Response Cancellation (M5)**: Detects `signal.aborted` or reason `'caller_abort'` → returns `{ isCancelled: true, error: 'cancelled' }`. `App.jsx` drops stale responses silently without displaying error UI.
  - **Client-side Timeout (M4)**: Detects `timeoutController.signal.aborted` or reason `'timeout'` → returns `{ isTimeout: true, error: 'Request timed out after 20 seconds...' }`. `App.jsx` renders `ErrorState` with the timeout message and Retry button.

### Bug 4: Space Key Conflict with Focused Navigation Buttons
- **Issue**: After clicking "Next", "Prev", or a dot indicator with the mouse, the clicked button retained browser focus. Pressing `Space` afterward re-triggered the native button `click` action (advancing or retreating cards) instead of flipping the card as promised by the UI hint.
- **Root Cause**: Browser focus remained on the `<button>` element after click. Since the previous keydown handler was scoped to `.flashcard-card`, pressing `Space` fired the browser's default button activation behavior.
- **Fix**: Implemented a two-part resolution in `FlashcardViewer.jsx`:
  1. Call `e.currentTarget.blur()` in `goNext`, `goPrev`, and `handleDotClick` to clear focus from buttons immediately upon mouse interaction.
  2. Mounted a global `keydown` event listener in `FlashcardViewer` that catches `Space` (when not inside `<textarea>` / `<input>`), calls `e.preventDefault()`, blurs any remaining button focus, and triggers `flipCard()`.
- **Verification**: Verified via `test/test-flashcard-space-key.js` that clicking Next/Prev/Dot followed by pressing `Space` reliably flips the active card's face without re-triggering navigation.

### Bug 5: Quiz Progress & Score State Reset on Tab Switch
- **Issue**: Completing a quiz or answering questions, switching to the "Flashcards" tab, and switching back to "Quiz" reset the quiz back to question 1 with all score and answer progress lost.
- **Root Cause**: `App.jsx` rendered `{activeTab === 'quiz' && <QuizMode ... />}` conditionally, which unmounted `<QuizMode />` from the React component tree when switching to the Flashcards tab. Unmounting destroyed all local component state (`answers`, `currentIdx`, `showResults`, `isRetestMode`).
- **Fix**: Updated `App.jsx` to render both tab panels persistently using HTML `hidden={activeTab !== ...}` and CSS `display: activeTab === ... ? 'block' : 'none'`. `QuizMode` remains mounted across tab switches, preserving full state (answers, current question, score card, and retest mode). When a new topic is generated (`studySet.topic` changes), `key={studySet.topic}` on `QuizMode` causes React to unmount the old instance and mount a fresh `QuizMode`, starting a clean quiz for the new topic.
- **Verification**: Verified via `test/test-tab-switch-quiz-persistence.js` that tab switching preserves all quiz state while new topic generation resets it.

---

## ⌨️ Accessibility & Keyboard Enhancements

- **Flashcard Viewer**: `Space` / `Enter` flips between Question/Answer faces; `ArrowLeft` / `ArrowRight` navigate cards.
- **Quiz Mode**:
  - `1–4` or `A–D` keys select answer options.
  - `Enter` / `Space` / `ArrowRight` advance to the next question (when answered).
  - `ArrowLeft` returns to the previous question.
- **Focus Indicators**: High-contrast `:focus-visible` outlines applied across all interactive elements (`.btn`, `.flashcard-card`, `.quiz-option`, `.tab-btn`, `.flashcard-dot`, `.input-panel-textarea`).
- **ARIA Semantics**: `role="button"`, `role="radio"`, `role="progressbar"`, `aria-pressed`, `aria-checked`, and dynamic `aria-label` descriptors applied throughout.

---

## 🧪 Automated Testing Suite

Run all verification scripts via Node:

```bash
# Run unified pre-deployment check suite (28/28 tests)
node test/manual-checks.js

# Run specific integration test scripts
node test/test-empty-state.js
node test/test-stale-response-trigger.js
node test/test-malformed-response-trigger.js
node test/test-quiz-keyboard.js
node test/test-accessibility.js
```
