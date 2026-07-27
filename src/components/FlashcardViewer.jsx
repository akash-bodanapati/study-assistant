/**
 * FlashcardViewer.jsx
 * Interactive flashcard component:
 *  - Displays one card at a time with 3D flip animation (front/back)
 *  - Prev/Next navigation and dot position indicators
 *  - Keyed card component ensures flip state and CSS transition
 *    never leak or flash when switching cards.
 */
import { useState, useCallback } from 'react';

/**
 * Single card component — keyed by card.id in the parent.
 * When the card ID changes, React unmounts the old card and mounts a fresh one
 * with isFlipped initialized to false. This prevents CSS rotation transitions
 * or answer content from flashing when navigating between cards.
 */
function FlashcardCard({ card, onPrev, onNext, isFirst, isLast }) {
  const [isFlipped, setIsFlipped] = useState(false);

  const flipCard = useCallback(() => {
    setIsFlipped((f) => !f);
  }, []);

  // Keyboard navigation when card is focused
  function handleKeyDown(e) {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      flipCard();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (!isFirst) onPrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (!isLast) onNext();
    }
  }

  return (
    <div className="flashcard-scene">
      <div
        id={`flashcard-${card.id}`}
        className={`flashcard-card ${isFlipped ? 'flipped' : ''}`}
        onClick={flipCard}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={
          isFlipped
            ? `Back of card: ${card.back} — press Space to flip back`
            : `Front of card: ${card.front} — press Space to reveal answer`
        }
        aria-pressed={isFlipped}
      >
        {/* Front face (Question) */}
        <div className="flashcard-face flashcard-front" aria-hidden={isFlipped}>
          <span className="flashcard-face-label">Question</span>
          <p className="flashcard-face-text">{card.front}</p>
          <span className="flashcard-flip-hint">
            <span>👆</span> Click or press Space to reveal answer
          </span>
        </div>

        {/* Back face (Answer) */}
        <div className="flashcard-face flashcard-back" aria-hidden={!isFlipped}>
          <span className="flashcard-face-label">Answer</span>
          <p className="flashcard-face-text">{card.back}</p>
          <span className="flashcard-flip-hint">
            <span>👆</span> Click to flip back
          </span>
        </div>
      </div>
    </div>
  );
}

export default function FlashcardViewer({ flashcards }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const total = flashcards.length;
  const current = flashcards[currentIndex];

  const goTo = useCallback((idx) => {
    setCurrentIndex(idx);
  }, []);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) goTo(currentIndex - 1);
  }, [currentIndex, goTo]);

  const goNext = useCallback(() => {
    if (currentIndex < total - 1) goTo(currentIndex + 1);
  }, [currentIndex, total, goTo]);

  const progressPct = total > 0 ? ((currentIndex + 1) / total) * 100 : 0;

  if (!flashcards || total === 0) return null;

  return (
    <div className="flashcard-viewer">
      {/* Progress bar + text */}
      <div className="flashcard-progress">
        <span className="flashcard-progress-text">
          Card {currentIndex + 1} of {total}
        </span>
        <span className="badge badge-accent">{Math.round(progressPct)}% through</span>
      </div>
      <div
        className="progress-bar"
        role="progressbar"
        aria-valuenow={currentIndex + 1}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Card ${currentIndex + 1} of ${total}`}
      >
        <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
      </div>

      {/* Keyed flashcard item — keying on card.id ensures a fresh DOM node and reset flip state */}
      <FlashcardCard
        key={current.id || currentIndex}
        card={current}
        onPrev={goPrev}
        onNext={goNext}
        isFirst={currentIndex === 0}
        isLast={currentIndex === total - 1}
      />

      {/* Navigation: Prev / dot indicators / Next */}
      <nav className="flashcard-nav" aria-label="Flashcard navigation">
        <button
          id="flashcard-prev-btn"
          className="btn btn-secondary"
          onClick={goPrev}
          disabled={currentIndex === 0}
          aria-label="Previous card"
        >
          ← Prev
        </button>

        {/* Dot indicators — clicking jumps directly to that card */}
        <div className="flashcard-dots" role="tablist" aria-label="Card position">
          {flashcards.map((card, idx) => (
            <button
              key={card.id || idx}
              className={`flashcard-dot ${idx === currentIndex ? 'active' : ''}`}
              onClick={() => goTo(idx)}
              role="tab"
              aria-selected={idx === currentIndex}
              aria-label={`Go to card ${idx + 1}`}
            />
          ))}
        </div>

        <button
          id="flashcard-next-btn"
          className="btn btn-secondary"
          onClick={goNext}
          disabled={currentIndex === total - 1}
          aria-label="Next card"
        >
          Next →
        </button>
      </nav>
    </div>
  );
}
