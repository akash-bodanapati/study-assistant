/**
 * App.jsx
 * Root component — manages global state and orchestrates:
 *  - Input panel (always visible at top)
 *  - Empty state / Loading / Error / Results rendering
 *  - Stale-response prevention via AbortController
 *  - Response validation before displaying
 *
 * State machine:
 *   'idle'    → empty state shown, user can type and submit
 *   'loading' → spinner/skeleton shown, submit button disabled
 *   'error'   → error panel shown with Retry button
 *   'results' → flashcard viewer + quiz tabs shown
 */
import { useState, useRef, useCallback } from 'react';
import './App.css';

import InputPanel       from './components/InputPanel';
import EmptyState       from './components/EmptyState';
import LoadingState     from './components/LoadingState';
import ErrorState       from './components/ErrorState';
import FlashcardViewer  from './components/FlashcardViewer';
import QuizMode         from './components/QuizMode';

import { generateStudySet } from './utils/api';
import { validateStudySet }  from './utils/validate';
// M1 mock: used during scaffolding; commented out once the real API is wired
// import { MOCK_STUDY_SET } from './utils/mockData';

export default function App() {
  const [appState, setAppState]     = useState('idle');    // 'idle' | 'loading' | 'error' | 'results'
  const [studySet, setStudySet]     = useState(null);      // validated AI response
  const [error, setError]           = useState(null);      // { message, isTimeout }
  const [activeTab, setActiveTab]   = useState('cards');   // 'cards' | 'quiz'
  const [lastText, setLastText]     = useState('');        // stored so Retry can re-submit

  /**
   * AbortController ref — holds the controller for any in-flight request.
   * When the user submits a new request, we abort the previous one so a
   * late-arriving response can never overwrite a newer result (M5 requirement).
   */
  const abortControllerRef = useRef(null);

  /**
   * Main submit handler.
   * Called by InputPanel when the user clicks Generate or hits Ctrl+Enter.
   */
  const handleSubmit = useCallback(async (text) => {
    // --- Stale-response protection (M5) ---
    // If a previous request is still in flight, cancel it before starting a new one.
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLastText(text);
    setAppState('loading');
    setError(null);
    setStudySet(null);
    setActiveTab('cards');

    // --- Real API call (M3) ---
    // generateStudySet posts to /api/generate, applies a 20s client-side timeout,
    // and returns { data } on success or { error, isTimeout, isCancelled } on failure.
    const result = await generateStudySet(text, controller.signal);

    // If this request was cancelled because a newer one started, discard the result.
    // This is the stale-response check: only accept results for the most recent request.
    if (result.isCancelled) return;

    if (result.error) {
      setError({ message: result.error, isTimeout: result.isTimeout ?? false });
      setAppState('error');
      return;
    }

    // --- Response validation (M4) ---
    // Even in structured-output mode the model can return unexpected shapes, so we
    // always validate before rendering. validateStudySet checks all required fields,
    // correct types, non-empty arrays, and correctIndex bounds.
    const validation = validateStudySet(result.data);
    if (!validation.valid) {
      setError({
        message: `The AI returned an unexpected response: ${validation.error}. Please try again.`,
        isTimeout: false,
      });
      setAppState('error');
      return;
    }

    setStudySet(validation.data);
    setAppState('results');
  }, []);

  // Retry re-uses the last submitted text
  const handleRetry = useCallback(() => {
    if (lastText) handleSubmit(lastText);
  }, [lastText, handleSubmit]);

  const isLoading = appState === 'loading';

  return (
    <div className="app">
      {/* ---- Header ---- */}
      <header className="header" role="banner">
        <div className="header-brand">
          <span className="header-logo" aria-hidden="true">📚</span>
          <div>
            <div className="header-title">Study Assistant</div>
            <div className="header-subtitle">AI-powered flashcards &amp; quizzes</div>
          </div>
        </div>
        {appState === 'results' && studySet && (
          <span className="badge badge-accent" aria-label={`Topic: ${studySet.topic}`}>
            {studySet.topic}
          </span>
        )}
      </header>

      {/* ---- Main content ---- */}
      <main className="main" role="main" id="main-content">

        {/* Input panel — always visible */}
        <InputPanel onSubmit={handleSubmit} isLoading={isLoading} />

        {/* State-driven content area */}

        {/* Idle: empty state */}
        {appState === 'idle' && <EmptyState />}

        {/* Loading: spinner + skeletons */}
        {appState === 'loading' && <LoadingState />}

        {/* Error: friendly message + retry */}
        {appState === 'error' && error && (
          <ErrorState
            error={error.message}
            isTimeout={error.isTimeout}
            onRetry={handleRetry}
          />
        )}

        {/* Results: flashcards + quiz tabs */}
        {appState === 'results' && studySet && (
          <section className="results" aria-label="Study set results">
            <div className="results-header">
              <div className="results-topic">
                <span className="results-topic-label">Study Set</span>
                <h1 className="results-topic-name">{studySet.topic}</h1>
              </div>

              {/* Tab switcher */}
              <div className="tabs" role="tablist" aria-label="View mode">
                <button
                  id="tab-cards"
                  role="tab"
                  className={`tab-btn ${activeTab === 'cards' ? 'active' : ''}`}
                  onClick={() => setActiveTab('cards')}
                  aria-selected={activeTab === 'cards'}
                  aria-controls="panel-cards"
                >
                  🃏 Flashcards ({studySet.flashcards.length})
                </button>
                <button
                  id="tab-quiz"
                  role="tab"
                  className={`tab-btn ${activeTab === 'quiz' ? 'active' : ''}`}
                  onClick={() => setActiveTab('quiz')}
                  aria-selected={activeTab === 'quiz'}
                  aria-controls="panel-quiz"
                >
                  🎯 Quiz ({studySet.quiz.length})
                </button>
              </div>
            </div>

            {/* Flashcard panel */}
            {activeTab === 'cards' && (
              <div id="panel-cards" role="tabpanel" aria-labelledby="tab-cards">
                <FlashcardViewer flashcards={studySet.flashcards} />
              </div>
            )}

            {/* Quiz panel */}
            {activeTab === 'quiz' && (
              <div id="panel-quiz" role="tabpanel" aria-labelledby="tab-quiz">
                {/*
                  Key the QuizMode on the topic so it fully resets whenever a new
                  study set is loaded — prevents stale quiz state from previous runs.
                */}
                <QuizMode key={studySet.topic} questions={studySet.quiz} />
              </div>
            )}
          </section>
        )}
      </main>

      {/* ---- Footer ---- */}
      <footer className="footer" role="contentinfo">
        <p>Study Assistant · Powered by Google Gemini · Made for learning</p>
      </footer>
    </div>
  );
}
