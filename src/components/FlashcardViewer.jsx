/**
 * FlashcardViewer.jsx
 * Interactive flashcard component:
 *  - Click/tap to flip between front and back (CSS 3D rotateY)
 *  - Previous/Next navigation buttons
 *  - Dot progress indicator + "Card N of M" text
 *  - Keyboard support: ← → to navigate, Space/Enter to flip
 *
 * Props:
 *   flashcards  {Array}  Array of { id, front, back } objects
 */
import { useState, useCallback } from 'react';

export default function FlashcardViewer({ flashcards }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const total = flashcards.length;
  const current = flashcards[currentIndex];

  const goTo = useCallback((idx) => {
    setCurrentIndex(idx);
    setIsFlipped(false); // always reset flip when navigating to a new card
  }, []);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) goTo(currentIndex - 1);
  }, [currentIndex, goTo]);

  const goNext = useCallback(() => {
    if (currentIndex < total - 1) goTo(currentIndex + 1);
  }, [currentIndex, total, goTo]);

  const flipCard = useCallback(() => {
    setIsFlipped((f) => !f);
  }, []);

  // Keyboard navigation: Space/Enter = flip, ArrowLeft/Right = navigate
  function handleKeyDown(e) {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      flipCard();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goPrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      goNext();
    }
  }

  const progressPct = ((currentIndex + 1) / total) * 100;

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

      {/* Flashcard with 3D flip — CSS perspective + rotateY(180deg) */}
      <div className="flashcard-scene">
        <div
          id={`flashcard-${current.id}`}
          className={`flashcard-card ${isFlipped ? 'flipped' : ''}`}
          onClick={flipCard}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="button"
          aria-label={
            isFlipped
              ? `Back of card: ${current.back} — press Space to flip back`
              : `Front of card: ${current.front} — press Space to reveal answer`
          }
          aria-pressed={isFlipped}
        >
          {/* Front face */}
          <div className="flashcard-face flashcard-front" aria-hidden={isFlipped}>
            <span className="flashcard-face-label">Question</span>
            <p className="flashcard-face-text">{current.front}</p>
            <span className="flashcard-flip-hint">
              <span>👆</span> Click or press Space to reveal answer
            </span>
          </div>

          {/* Back face — rotated 180° in CSS, flipped back to readable via backface-visibility */}
          <div className="flashcard-face flashcard-back" aria-hidden={!isFlipped}>
            <span className="flashcard-face-label">Answer</span>
            <p className="flashcard-face-text">{current.back}</p>
            <span className="flashcard-flip-hint">
              <span>👆</span> Click to flip back
            </span>
          </div>
        </div>
      </div>

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
              key={card.id}
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
