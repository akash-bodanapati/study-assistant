/**
 * InputPanel.jsx
 * The single entry point for user input. Contains a textarea and a Submit button.
 * The button is disabled while a request is in flight (isLoading=true).
 *
 * Props:
 *   onSubmit   {function} Called with the trimmed text when user submits
 *   isLoading  {boolean}  Disables input and button while request is in flight
 */
import { useState } from 'react';

const MAX_CHARS = 5000;

export default function InputPanel({ onSubmit, isLoading }) {
  const [text, setText] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  }

  function handleKeyDown(e) {
    // Ctrl/Cmd + Enter submits
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit(e);
    }
  }

  const charCount = text.length;
  const isOverLimit = charCount > MAX_CHARS;
  const canSubmit = text.trim().length > 0 && !isLoading && !isOverLimit;

  return (
    <form className="input-panel" onSubmit={handleSubmit} aria-label="Study set generator">
      <label className="input-panel-label" htmlFor="study-input">
        Your Notes or Topic
      </label>

      <textarea
        id="study-input"
        className="input-panel-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Paste your notes, a textbook excerpt, or just type a topic…
e.g. &quot;The French Revolution&quot; or &quot;Explain photosynthesis&quot;"
        disabled={isLoading}
        aria-label="Notes or topic text"
        aria-describedby="input-hint char-counter"
        maxLength={MAX_CHARS + 500}   /* allow slightly over so user sees the warning */
      />

      <div className="input-panel-footer">
        <span id="input-hint" className="input-panel-hint">
          💡 Tip: more specific notes produce better flashcards &nbsp;·&nbsp; <kbd>Ctrl+Enter</kbd> to submit
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <span
            id="char-counter"
            className={`char-count ${isOverLimit ? 'warn' : ''}`}
            aria-live="polite"
            aria-label={`${charCount} of ${MAX_CHARS} characters`}
          >
            {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
          </span>

          <button
            id="generate-btn"
            type="submit"
            className="btn btn-primary"
            disabled={!canSubmit}
            aria-label={isLoading ? 'Generating study set, please wait' : 'Generate flashcards and quiz'}
          >
            {isLoading ? (
              <>
                <span style={{
                  display: 'inline-block',
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }} aria-hidden="true" />
                Generating…
              </>
            ) : (
              <>⚡ Generate</>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
