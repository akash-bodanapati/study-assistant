/**
 * FlashcardViewer.jsx
 * Interactive flashcard component:
 *  - Displays one card at a time with 3D flip animation (front/back)
 *  - Prev/Next navigation and dot position indicators
 *  - Global Space/Enter/Arrow keyboard shortcuts so Space ALWAYS flips the card,
 *    even after clicking Next, Prev, or dot indicators with the mouse.
 */
import { useState, useCallback, useEffect } from 'react';

/**
 * Single card component — rendered with key={current.id || currentIndex} in parent.
 */
function FlashcardCard({ card, isFlipped, onFlip }) {
  return (
    <div className="flashcard-scene">
      <div
        id={`flashcard-${card.id}`}
        className={`flashcard-card ${isFlipped ? 'flipped' : ''}`}
        onClick={onFlip}
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
  const [isFlipped, setIsFlipped] = useState(false);

  const total = flashcards.length;
  const current = flashcards[currentIndex];

  const flipCard = useCallback(() => {
    setIsFlipped((f) => !f);
  }, []);

  const goTo = useCallback((idx) => {
    setCurrentIndex(idx);
    setIsFlipped(false);
  }, []);

  const goPrev = useCallback((e) => {
    if (e?.currentTarget && typeof e.currentTarget.blur === 'function') {
      e.currentTarget.blur();
    }
    if (currentIndex > 0) goTo(currentIndex - 1);
  }, [currentIndex, goTo]);

  const goNext = useCallback((e) => {
    if (e?.currentTarget && typeof e.currentTarget.blur === 'function') {
      e.currentTarget.blur();
    }
    if (currentIndex < total - 1) goTo(currentIndex + 1);
  }, [currentIndex, total, goTo]);

  const handleDotClick = useCallback((idx, e) => {
    if (e?.currentTarget && typeof e.currentTarget.blur === 'function') {
      e.currentTarget.blur();
    }
    goTo(idx);
  }, [goTo]);

  // Global keydown listener so Space ALWAYS flips the card, regardless of button focus
  useEffect(() => {
    function handleKeyDown(e) {
      // Don't intercept when user is typing in form controls
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === 'textarea' || tag === 'input') return;

      const key = e.key;

      if (key === ' ' || key === 'Spacebar') {
        e.preventDefault();
        // Blur any focused button so browser native click doesn't re-trigger
        if (e.target && typeof e.target.blur === 'function' && e.target.tagName?.toLowerCase() === 'button') {
          e.target.blur();
        }
        flipCard();
      } else if (key === 'Enter') {
        // If focus is not on a button, Enter flips the card
        if (e.target?.tagName?.toLowerCase() !== 'button') {
          e.preventDefault();
          flipCard();
        }
      } else if (key === 'ArrowLeft') {
        e.preventDefault();
        if (currentIndex > 0) goTo(currentIndex - 1);
      } else if (key === 'ArrowRight') {
        e.preventDefault();
        if (currentIndex < total - 1) goTo(currentIndex + 1);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, total, flipCard, goTo]);

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

      {/* Keyed card component — ensures a fresh DOM node and reset flip state on card change */}
      <FlashcardCard
        key={current.id || currentIndex}
        card={current}
        isFlipped={isFlipped}
        onFlip={flipCard}
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
              onClick={(e) => handleDotClick(idx, e)}
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
