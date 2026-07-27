/**
 * QuizMode.jsx
 * Full quiz flow in one component:
 *  - Presents one question at a time with A/B/C/D letter buttons
 *  - User selects an option, then clicks Next to advance (answer locks in immediately)
 *  - Explanation shown inline after answering each question
 *  - Results screen: score, per-question breakdown with correct/wrong indicators
 *  - "Retest wrong answers" — restarts quiz with only incorrectly-answered questions
 *
 * Props:
 *   questions  {Array}  Array of quiz question objects from the JSON contract
 */
import { useState, useCallback } from 'react';

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

// Score classification used for colour + emoji on the results screen
function getScoreInfo(correct, total) {
  const pct = total === 0 ? 0 : (correct / total) * 100;
  if (pct >= 90) return { emoji: '🏆', label: 'Excellent!',    cls: 'excellent'   };
  if (pct >= 70) return { emoji: '🎯', label: 'Good work!',   cls: 'good'        };
  if (pct >= 50) return { emoji: '📖', label: 'Keep studying!', cls: 'needs-work' };
  return            { emoji: '💪', label: "Don't give up!", cls: 'poor'        };
}

export default function QuizMode({ questions }) {
  // activeQuestions is either the full set or just the wrong-answer subset (retest)
  const [activeQuestions, setActiveQuestions] = useState(questions);
  const [currentIdx, setCurrentIdx]           = useState(0);
  const [answers, setAnswers]                 = useState({}); // { questionId: selectedOptionIndex }
  const [showResults, setShowResults]         = useState(false);
  const [isRetestMode, setIsRetestMode]       = useState(false);

  const total   = activeQuestions.length;
  const current = activeQuestions[currentIdx];
  const hasAnswered = current.id in answers;
  const selectedIdx = answers[current.id];

  function selectOption(idx) {
    if (hasAnswered) return; // lock — can't change answer
    setAnswers((prev) => ({ ...prev, [current.id]: idx }));
  }

  function handleNext() {
    if (currentIdx < total - 1) {
      setCurrentIdx((i) => i + 1);
    } else {
      setShowResults(true);
    }
  }

  function handlePrev() {
    if (currentIdx > 0) setCurrentIdx((i) => i - 1);
  }

  // Build graded results from the answers map
  const gradedResults = activeQuestions.map((q) => ({
    ...q,
    userAnswer: answers[q.id],
    isCorrect:  answers[q.id] === q.correctIndex,
    answered:   q.id in answers,
  }));

  const correctCount = gradedResults.filter((r) => r.isCorrect).length;
  const scoreInfo    = getScoreInfo(correctCount, total);

  // Only the originally-wrong questions, looked up from the full set
  const wrongQuestions = gradedResults
    .filter((r) => !r.isCorrect)
    .map((r) => questions.find((q) => q.id === r.id));

  const retestWrong = useCallback(() => {
    setActiveQuestions(wrongQuestions);
    setAnswers({});
    setCurrentIdx(0);
    setShowResults(false);
    setIsRetestMode(true);
  }, [wrongQuestions]);

  const restartFull = useCallback(() => {
    setActiveQuestions(questions);
    setAnswers({});
    setCurrentIdx(0);
    setShowResults(false);
    setIsRetestMode(false);
  }, [questions]);

  // ── Results view ───────────────────────────────────────────────────────────
  if (showResults) {
    return (
      <div className="quiz-results">
        <div className="quiz-score-card">
          <div className="quiz-score-emoji" aria-hidden="true">{scoreInfo.emoji}</div>
          {isRetestMode && (
            <span className="badge badge-accent" style={{ marginBottom: '0.25rem' }}>
              Retest Mode
            </span>
          )}
          <div
            className={`quiz-score-value ${scoreInfo.cls}`}
            aria-label={`Score: ${correctCount} out of ${total}`}
          >
            {correctCount} / {total}
          </div>
          <p className="quiz-score-label">
            {scoreInfo.label} &nbsp;·&nbsp; {Math.round((correctCount / total) * 100)}% correct
          </p>

          <div className="quiz-score-actions">
            {wrongQuestions.length > 0 && (
              <button
                id="retest-wrong-btn"
                className="btn btn-primary"
                onClick={retestWrong}
                aria-label={`Retest ${wrongQuestions.length} wrong answer${wrongQuestions.length !== 1 ? 's' : ''}`}
              >
                🔁 Retest Wrong ({wrongQuestions.length})
              </button>
            )}
            <button
              id="restart-quiz-btn"
              className="btn btn-secondary"
              onClick={restartFull}
            >
              ↺ Restart Full Quiz
            </button>
          </div>
        </div>

        {/* Per-question breakdown */}
        <div className="quiz-results-list" role="list" aria-label="Quiz results breakdown">
          {gradedResults.map((r, idx) => (
            <div
              key={r.id}
              className={`quiz-result-item ${r.isCorrect ? 'correct-result' : 'wrong-result'}`}
              role="listitem"
            >
              <div className="quiz-result-header">
                <span className="quiz-result-icon" aria-hidden="true">
                  {r.isCorrect ? '✅' : '❌'}
                </span>
                <p className="quiz-result-question">
                  {idx + 1}. {r.question}
                </p>
              </div>
              <p className="quiz-result-meta">
                {r.answered
                  ? r.isCorrect
                    ? `Your answer: ${r.options[r.userAnswer]} ✓`
                    : `Your answer: ${r.options[r.userAnswer] ?? '(no answer)'} · Correct: ${r.options[r.correctIndex]}`
                  : '(not answered)'}
              </p>
              {r.explanation && (
                <p className="quiz-result-explanation">💡 {r.explanation}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Active quiz view ───────────────────────────────────────────────────────
  const progressPct = ((currentIdx + 1) / total) * 100;

  return (
    <div className="quiz-mode">
      <div className="quiz-header">
        <span className="quiz-progress-text">
          {isRetestMode && (
            <span className="badge badge-accent" style={{ marginRight: '0.5rem' }}>Retest</span>
          )}
          Question {currentIdx + 1} of {total}
        </span>
        <span className="badge badge-accent">{Math.round(progressPct)}% done</span>
      </div>

      <div
        className="progress-bar"
        role="progressbar"
        aria-valuenow={currentIdx + 1}
        aria-valuemin={1}
        aria-valuemax={total}
      >
        <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="quiz-question-card" role="group" aria-labelledby={`q-label-${current.id}`}>
        <p className="quiz-question-number">Question {currentIdx + 1}</p>
        <h2 id={`q-label-${current.id}`} className="quiz-question-text">
          {current.question}
        </h2>

        <div className="quiz-options" role="radiogroup" aria-label="Answer choices">
          {current.options.map((opt, idx) => {
            let optClass = '';
            if (hasAnswered) {
              if (idx === current.correctIndex)  optClass = 'correct';
              else if (idx === selectedIdx)      optClass = 'incorrect';
            } else if (idx === selectedIdx) {
              optClass = 'selected';
            }

            return (
              <button
                key={idx}
                id={`option-${current.id}-${idx}`}
                className={`quiz-option ${optClass}`}
                onClick={() => selectOption(idx)}
                disabled={hasAnswered}
                role="radio"
                aria-checked={selectedIdx === idx}
                aria-label={`Option ${OPTION_LETTERS[idx]}: ${opt}${
                  idx === current.correctIndex && hasAnswered ? ' (correct answer)' : ''
                }`}
              >
                <span className="quiz-option-letter" aria-hidden="true">
                  {OPTION_LETTERS[idx]}
                </span>
                {opt}
              </button>
            );
          })}
        </div>

        {/* Explanation shown immediately after the user answers */}
        {hasAnswered && current.explanation && (
          <div className="quiz-explanation" role="status" aria-live="polite">
            <strong>💡 Explanation:</strong> {current.explanation}
          </div>
        )}
      </div>

      <div className="quiz-nav">
        <button
          id="quiz-prev-btn"
          className="btn btn-secondary"
          onClick={handlePrev}
          disabled={currentIdx === 0}
          aria-label="Previous question"
        >
          ← Prev
        </button>

        <button
          id="quiz-next-btn"
          className="btn btn-primary"
          onClick={handleNext}
          disabled={!hasAnswered}
          aria-label={
            currentIdx === total - 1 ? 'Finish quiz and see results' : 'Next question'
          }
        >
          {currentIdx === total - 1 ? 'Finish & See Results →' : 'Next →'}
        </button>
      </div>
    </div>
  );
}
