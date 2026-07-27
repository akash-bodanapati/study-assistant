/**
 * EmptyState.jsx
 * Shown before the user has submitted anything — a welcoming landing
 * panel with step-by-step instructions so the page is never blank.
 */
export default function EmptyState() {
  return (
    <div className="empty-state" role="region" aria-label="Getting started">
      <div className="empty-state-icon" aria-hidden="true">📚</div>

      <h1 className="empty-state-title">Study Smarter with AI</h1>

      <p className="empty-state-description">
        Paste your notes, paste a textbook excerpt, or just type a topic.
        Our AI will instantly generate flashcards and a quiz — ready to study.
      </p>

      <div className="empty-state-steps" role="list">
        <div className="empty-state-step card" role="listitem">
          <span className="step-icon" aria-hidden="true">✏️</span>
          <span className="step-label">1. Enter your topic</span>
          <span className="step-desc">Paste notes or type any subject</span>
        </div>
        <div className="empty-state-step card" role="listitem">
          <span className="step-icon" aria-hidden="true">⚡</span>
          <span className="step-label">2. Generate</span>
          <span className="step-desc">AI creates flashcards &amp; quiz in seconds</span>
        </div>
        <div className="empty-state-step card" role="listitem">
          <span className="step-icon" aria-hidden="true">🎯</span>
          <span className="step-label">3. Study &amp; Quiz</span>
          <span className="step-desc">Flip cards, take the quiz, retest your weak spots</span>
        </div>
      </div>
    </div>
  );
}
