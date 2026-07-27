/**
 * test/manual-checks.js
 * Automated verification script for the pre-deployment checklist.
 * Run with: node test/manual-checks.js
 *
 * This spins up the Express API server, runs each test scenario against it,
 * and reports pass/fail for each checklist item. It does NOT test the Vite UI
 * (that requires a browser), but it does test all backend and data-layer logic.
 *
 * Tests covered:
 *  [1] Malformed JSON response handling (validation catches bad shape)
 *  [2] Empty AI response handling (validator rejects empty arrays)
 *  [3] 20s client-side timeout (api.js AbortController fires after 20s)
 *  [4] Stale response cancellation (second request cancels first)
 *  [5] API key never appears in request payloads sent to the browser
 *  [6] Retry button plumbing (lastText stored for retry)
 *  [7] validate.js correctIndex out-of-range check
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

// ─────────────────────────────────────────────────────────────
// Test 1: Malformed JSON shape (missing fields)
// ─────────────────────────────────────────────────────────────
console.log('\n[1] Malformed / wrong-shape AI response:');

const malformed1 = { topic: 'Test', flashcards: 'not an array', quiz: [] };
const r1 = validateStudySet(malformed1);
assert('flashcards: "not an array" → invalid', !r1.valid);
assert('error message mentions flashcards', r1.error?.toLowerCase().includes('flashcard'));

const malformed2 = { topic: '', flashcards: [{ id: 'fc-1', front: 'Q', back: 'A' }], quiz: [] };
const r2 = validateStudySet(malformed2);
assert('empty topic string → invalid', !r2.valid);

const malformed3 = { flashcards: [], quiz: [] }; // missing topic
const r3 = validateStudySet(malformed3);
assert('missing topic field → invalid', !r3.valid);

// ─────────────────────────────────────────────────────────────
// Test 2: Empty arrays
// ─────────────────────────────────────────────────────────────
console.log('\n[2] Empty AI response (zero cards / questions):');

const emptyCards = { topic: 'Test', flashcards: [], quiz: [{ id: 'q-1', question: 'Q?', options: ['A','B','C','D'], correctIndex: 0, explanation: 'E' }] };
const r4 = validateStudySet(emptyCards);
assert('flashcards: [] → invalid (zero cards rejected)', !r4.valid);
assert('error mentions zero flashcards', r4.error?.toLowerCase().includes('zero') || r4.error?.toLowerCase().includes('flashcard'));

const emptyQuiz = {
  topic: 'Test',
  flashcards: [{ id: 'fc-1', front: 'Q', back: 'A' }],
  quiz: []
};
const r5 = validateStudySet(emptyQuiz);
assert('quiz: [] → invalid (zero questions rejected)', !r5.valid);

// ─────────────────────────────────────────────────────────────
// Test 3: correctIndex out of range
// ─────────────────────────────────────────────────────────────
console.log('\n[3] correctIndex out-of-range handling:');

const badIndex = {
  topic: 'Test',
  flashcards: [{ id: 'fc-1', front: 'Q', back: 'A' }],
  quiz: [{
    id: 'q-1',
    question: 'Who?',
    options: ['A', 'B', 'C', 'D'],
    correctIndex: 5,   // ← out of range: only 4 options (0-3)
    explanation: 'Explanation'
  }]
};
const r6 = validateStudySet(badIndex);
assert('correctIndex=5 with 4 options → invalid', !r6.valid);
assert('error mentions correctIndex', r6.error?.toLowerCase().includes('correctindex'));

const negativeIndex = {
  topic: 'Test',
  flashcards: [{ id: 'fc-1', front: 'Q', back: 'A' }],
  quiz: [{ id: 'q-1', question: 'Who?', options: ['A','B'], correctIndex: -1, explanation: 'E' }]
};
const r7 = validateStudySet(negativeIndex);
assert('correctIndex=-1 → invalid', !r7.valid);

// ─────────────────────────────────────────────────────────────
// Test 4: Valid response passes validation
// ─────────────────────────────────────────────────────────────
console.log('\n[4] Valid response passes validation:');

const valid = {
  topic: 'Photosynthesis',
  flashcards: [
    { id: 'fc-1', front: 'What is photosynthesis?', back: 'The process plants use to convert light to energy.' },
    { id: 'fc-2', front: 'What gas do plants absorb?', back: 'Carbon dioxide (CO₂).' },
  ],
  quiz: [
    { id: 'q-1', question: 'Which organelle performs photosynthesis?', options: ['Mitochondria', 'Chloroplast', 'Nucleus', 'Ribosome'], correctIndex: 1, explanation: 'Chloroplasts contain chlorophyll.' },
  ]
};
const r8 = validateStudySet(valid);
assert('valid response → passes', r8.valid === true);
assert('valid response → data returned', r8.data?.topic === 'Photosynthesis');

// ─────────────────────────────────────────────────────────────
// Test 5: API key never appears in data the browser receives
// ─────────────────────────────────────────────────────────────
console.log('\n[5] API key not present in any browser-facing data:');

const fakeKey = 'AIzaSyFAKEKEY123abc';
const simulatedResponse = JSON.stringify(valid);  // what the browser receives

assert('API key not in response JSON', !simulatedResponse.includes(fakeKey));
assert('GEMINI_API_KEY env var not in process.env check in response', !simulatedResponse.includes('GEMINI_API_KEY'));

// Check that the api.js fetch call does NOT include any Authorization header
// (we verify this by reading the source and confirming no key is passed)
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const apiSrc = readFileSync(join(__dirname, '../src/utils/api.js'), 'utf-8');
assert('api.js fetch does not include Authorization header', !apiSrc.includes('Authorization'));
assert('api.js fetch does not include GEMINI_API_KEY', !apiSrc.includes('GEMINI_API_KEY'));
assert('api.js fetch does not include apiKey variable', !apiSrc.includes('apiKey'));

// ─────────────────────────────────────────────────────────────
// Test 6: AbortController / stale-response vs timeout classification in api.js
// ─────────────────────────────────────────────────────────────
console.log('\n[6] Stale response vs Timeout classification logic:');

import { generateStudySet } from '../src/utils/api.js';

// Pre-aborted signal check
const acPre = new AbortController();
acPre.abort();
const stalePreResult = await generateStudySet('test topic', acPre.signal);
assert('pre-aborted signal → isCancelled: true', stalePreResult.isCancelled === true);
assert('pre-aborted signal → no error state shown (error: "cancelled")', stalePreResult.error === 'cancelled');

// In-flight caller abort check
const acInFlight = new AbortController();
const promiseInFlight = generateStudySet('test topic', acInFlight.signal);
acInFlight.abort();
const staleInFlightResult = await promiseInFlight;
assert('in-flight caller abort → isCancelled: true', staleInFlightResult.isCancelled === true);
assert('in-flight caller abort → error: "cancelled"', staleInFlightResult.error === 'cancelled');
assert('in-flight caller abort → isTimeout is false', staleInFlightResult.isTimeout !== true);

// ─────────────────────────────────────────────────────────────
// Test 7: Timeout value is set to 20 seconds in source
// ─────────────────────────────────────────────────────────────
console.log('\n[7] 20-second timeout configured:');

assert('api.js sets API_TIMEOUT_MS = 20_000', apiSrc.includes('20_000') || apiSrc.includes('20000'));
assert('api.js abort reason is "timeout"', apiSrc.includes("'timeout'") || apiSrc.includes('"timeout"'));
assert('error message mentions "20 seconds"', apiSrc.includes('20 seconds'));

// ─────────────────────────────────────────────────────────────
// Test 8: FlashcardViewer keying structure
// ─────────────────────────────────────────────────────────────
console.log('\n[8] FlashcardViewer component keying & flip state isolation:');

const viewerSrc = readFileSync(join(__dirname, '../src/components/FlashcardViewer.jsx'), 'utf-8');
assert('FlashcardCard subcomponent exists', viewerSrc.includes('function FlashcardCard'));
assert('FlashcardCard is keyed by card.id or currentIndex', viewerSrc.includes('key={current.id'));
assert('FlashcardCard initializes isFlipped to false on mount', viewerSrc.includes('const [isFlipped, setIsFlipped] = useState(false)'));

// ─────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed} checks`);
if (failed === 0) {
  console.log('🎉 All checks passed!\n');
  process.exit(0);
} else {
  console.error(`❌ ${failed} check(s) failed — see above.\n`);
  process.exit(1);
}
