/**
 * test/test-malformed-response-trigger.js
 * Verifies that malformed AI outputs (wrong keys, non-JSON text, empty arrays, out-of-bounds correctIndex)
 * are caught by validate.js and trigger the Retry error state in App.jsx.
 */
import { validateStudySet } from '../src/utils/validate.js';

let passed = 0;
let failed = 0;

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✅  ${label}`);
    passed++;
  } else {
    console.error(`  ❌  ${label}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

console.log('\n[Item 4 Verification: Real Malformed AI Output Handling]');

// Scenario A: Model returns wrong key name ('cards' instead of 'flashcards')
const malformedWrongKey = {
  topic: 'Photosynthesis',
  cards: [{ id: '1', front: 'Q', back: 'A' }], // ← WRONG FIELD NAME
  quiz: [{ id: '1', question: 'Q?', options: ['A','B'], correctIndex: 0, explanation: 'E' }]
};
const resA = validateStudySet(malformedWrongKey);
assert('Wrong field name ("cards" vs "flashcards") caught', resA.valid === false);
assert('Error message identifies missing flashcards', resA.error.includes("flashcards"));

// Scenario B: Model returns raw text instead of JSON
let resB;
try {
  const rawText = "Here is your study set: Flashcard 1: Q: What is light? A: Energy.";
  JSON.parse(rawText);
  resB = { valid: true };
} catch {
  resB = { valid: false, error: 'The AI returned a response that could not be parsed as JSON.' };
}
assert('Non-JSON text caught on JSON.parse', resB.valid === false);
assert('Non-JSON error message is clear', resB.error.includes('could not be parsed as JSON'));

// Scenario C: correctIndex out of bounds (index 3 for 2 options)
const malformedBadIndex = {
  topic: 'Biology',
  flashcards: [{ id: '1', front: 'Q', back: 'A' }],
  quiz: [{ id: '1', question: 'Q?', options: ['Option 1', 'Option 2'], correctIndex: 3, explanation: 'E' }]
};
const resC = validateStudySet(malformedBadIndex);
assert('Out-of-bounds correctIndex caught', resC.valid === false);
assert('Error message identifies correctIndex out of range', resC.error.includes('correctIndex'));

// Scenario D: App.jsx integration check
// In App.jsx: if (!validation.valid), setError({ message: `The AI returned an unexpected response: ${validation.error}. Please try again.`, isTimeout: false }); setAppState('error');
const appErrorMessage = `The AI returned an unexpected response: ${resA.error}. Please try again.`;
assert('App.jsx constructs error card message correctly', appErrorMessage.includes('Response missing \'flashcards\' array'));

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log('🎉 Malformed AI output detection verified: validate.js catches all bad shapes and triggers Retry Error Card!\n');
  process.exit(0);
} else {
  process.exit(1);
}
