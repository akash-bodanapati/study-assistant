/**
 * test/test-accessibility.js
 * Verifies accessibility attributes and focus styles across all components.
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const inputSrc = readFileSync(join(__dirname, '../src/components/InputPanel.jsx'), 'utf-8');
const cardSrc = readFileSync(join(__dirname, '../src/components/FlashcardViewer.jsx'), 'utf-8');
const quizSrc = readFileSync(join(__dirname, '../src/components/QuizMode.jsx'), 'utf-8');
const cssSrc = readFileSync(join(__dirname, '../src/App.css'), 'utf-8');

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

console.log('\n[Item 6 Verification: Accessibility Pass]');
assert('Generate button has dynamic aria-label', inputSrc.includes('aria-label='));
assert('Textarea has aria-label and aria-describedby', inputSrc.includes('aria-label=') && inputSrc.includes('aria-describedby='));
assert('Flashcard card has role="button" and aria-label', cardSrc.includes('role="button"') && cardSrc.includes('aria-label='));
assert('Flashcard card has aria-pressed', cardSrc.includes('aria-pressed='));
assert('Quiz options have role="radio" and aria-label', quizSrc.includes('role="radio"') && quizSrc.includes('aria-label='));
assert('Quiz option letters marked aria-hidden', quizSrc.includes('aria-hidden="true"'));
assert('App.css contains :focus-visible rules for interactive elements', cssSrc.includes(':focus-visible'));

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log('🎉 Accessibility checks passed!\n');
  process.exit(0);
} else {
  process.exit(1);
}
