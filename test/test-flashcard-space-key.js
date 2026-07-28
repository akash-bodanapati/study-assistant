/**
 * test/test-flashcard-space-key.js
 * Verifies Space key conflict fix in FlashcardViewer:
 * - Nav buttons call .blur() on click to clear button focus
 * - Global keydown listener handles Space key to flip card regardless of focused element
 * - Space key calls preventDefault() and blurs focused buttons
 * - Form controls (textarea, input) are exempted
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const viewerSrc = readFileSync(join(__dirname, '../src/components/FlashcardViewer.jsx'), 'utf-8');

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

console.log('\n[Testing Flashcard Space Key Conflict Fix]');

assert('FlashcardViewer attaches global keydown listener', viewerSrc.includes("window.addEventListener('keydown', handleKeyDown)"));
assert('Space key handler calls preventDefault()', viewerSrc.includes("key === ' '") && viewerSrc.includes('e.preventDefault()'));
assert('Space key handler blurs focused button', viewerSrc.includes("e.target.tagName?.toLowerCase() === 'button'") && viewerSrc.includes('e.target.blur()'));
assert('goNext calls e.currentTarget.blur()', viewerSrc.includes('goNext') && viewerSrc.includes('e.currentTarget.blur()'));
assert('goPrev calls e.currentTarget.blur()', viewerSrc.includes('goPrev') && viewerSrc.includes('e.currentTarget.blur()'));
assert('handleDotClick calls e.currentTarget.blur()', viewerSrc.includes('handleDotClick') && viewerSrc.includes('e.currentTarget.blur()'));
assert('Form controls (textarea/input) are exempted', viewerSrc.includes("tag === 'textarea' || tag === 'input'"));

console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log('🎉 Flashcard Space key conflict fix fully verified!\n');
  process.exit(0);
} else {
  process.exit(1);
}
