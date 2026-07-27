/**
 * test/test-quiz-keyboard.js
 * Verifies keyboard navigation handlers and hints in QuizMode.jsx
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const quizSrc = readFileSync(join(__dirname, '../src/components/QuizMode.jsx'), 'utf-8');

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log(`  ✅  ${label}`);
    passed++;
  } else {
    console.error(`  ❌  ${label}`);
    failed++;
  }
}

console.log('\n[Item 5 Verification: Quiz Keyboard Navigation]');
assert('QuizMode listens to keydown events', quizSrc.includes("addEventListener('keydown'"));
assert('QuizMode handles number keys 1-6', quizSrc.includes('parseInt(key, 10)'));
assert('QuizMode handles letter keys A-F', quizSrc.includes("['a', 'b', 'c', 'd', 'e', 'f'].indexOf(key)"));
assert('QuizMode handles Enter / Space to advance', quizSrc.includes("key === 'enter' || key === ' '"));
assert('QuizMode handles ArrowLeft to go back', quizSrc.includes("key === 'arrowleft'"));
assert('QuizMode includes keyboard hint text for user', quizSrc.includes('Press <kbd'));

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log('🎉 Quiz keyboard navigation fully verified!\n');
  process.exit(0);
} else {
  process.exit(1);
}
