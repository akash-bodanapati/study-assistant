/**
 * validate.js
 * Hand-written validation for the AI JSON contract.
 * We validate here (not just trust the model) because even with structured
 * output mode the model can occasionally return malformed JSON or
 * slightly wrong shapes (e.g. missing fields, wrong types, out-of-range indexes).
 */

/**
 * Validates a single flashcard object.
 * Returns an error string if invalid, null if valid.
 */
function validateFlashcard(card, idx) {
  if (!card || typeof card !== 'object') return `Flashcard ${idx}: not an object`;
  if (typeof card.id !== 'string' || !card.id.trim()) return `Flashcard ${idx}: missing or empty 'id'`;
  if (typeof card.front !== 'string' || !card.front.trim()) return `Flashcard ${idx}: missing or empty 'front'`;
  if (typeof card.back !== 'string' || !card.back.trim()) return `Flashcard ${idx}: missing or empty 'back'`;
  return null;
}

/**
 * Validates a single quiz question object.
 * Returns an error string if invalid, null if valid.
 */
function validateQuizQuestion(q, idx) {
  if (!q || typeof q !== 'object') return `Question ${idx}: not an object`;
  if (typeof q.id !== 'string' || !q.id.trim()) return `Question ${idx}: missing or empty 'id'`;
  if (typeof q.question !== 'string' || !q.question.trim()) return `Question ${idx}: missing or empty 'question'`;

  if (!Array.isArray(q.options)) return `Question ${idx}: 'options' must be an array`;
  if (q.options.length < 2) return `Question ${idx}: must have at least 2 options`;
  for (let i = 0; i < q.options.length; i++) {
    if (typeof q.options[i] !== 'string' || !q.options[i].trim()) {
      return `Question ${idx}: option[${i}] is empty or not a string`;
    }
  }

  if (typeof q.correctIndex !== 'number' || !Number.isInteger(q.correctIndex)) {
    return `Question ${idx}: 'correctIndex' must be an integer`;
  }
  if (q.correctIndex < 0 || q.correctIndex >= q.options.length) {
    return `Question ${idx}: 'correctIndex' (${q.correctIndex}) is out of range for ${q.options.length} options`;
  }

  if (typeof q.explanation !== 'string') return `Question ${idx}: 'explanation' must be a string`;
  return null;
}

/**
 * Top-level validator for the entire AI response.
 * Returns { valid: true, data } on success or { valid: false, error: string } on failure.
 */
export function validateStudySet(raw) {
  // Must be a non-null object
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { valid: false, error: 'Response is not a JSON object.' };
  }

  // topic
  if (typeof raw.topic !== 'string' || !raw.topic.trim()) {
    return { valid: false, error: "Response missing required 'topic' string field." };
  }

  // flashcards
  if (!Array.isArray(raw.flashcards)) {
    return { valid: false, error: "Response missing 'flashcards' array." };
  }
  if (raw.flashcards.length === 0) {
    return { valid: false, error: 'AI returned zero flashcards — please try again.' };
  }
  for (let i = 0; i < raw.flashcards.length; i++) {
    const err = validateFlashcard(raw.flashcards[i], i + 1);
    if (err) return { valid: false, error: `Invalid flashcard: ${err}` };
  }

  // quiz
  if (!Array.isArray(raw.quiz)) {
    return { valid: false, error: "Response missing 'quiz' array." };
  }
  if (raw.quiz.length === 0) {
    return { valid: false, error: 'AI returned zero quiz questions — please try again.' };
  }
  for (let i = 0; i < raw.quiz.length; i++) {
    const err = validateQuizQuestion(raw.quiz[i], i + 1);
    if (err) return { valid: false, error: `Invalid quiz question: ${err}` };
  }

  return { valid: true, data: raw };
}
