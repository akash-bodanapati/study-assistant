/**
 * test/test-ai-honesty-prompt.js
 * Verifies AI honesty and topic disclosure instructions in api/generate.js:
 * 1. Specific/future/unverified topics (e.g., "IPL 2026") require explicit topic disclosure (e.g., "IPL (General Overview)").
 * 2. Gibberish/meaningless inputs fallback to "General Study Set" without disclosure tags.
 * 3. Standard topics receive clean, concise titles without unnecessary tags.
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const apiSrc = readFileSync(join(__dirname, '../api/generate.js'), 'utf-8');

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

console.log('\n[Testing AI Honesty & Topic Disclosure Instructions]');

assert('Prompt contains SPECIFIC/FUTURE topic disclosure rule', apiSrc.includes('SPECIFIC, RECENT, OR FUTURE TOPICS'));
assert('Prompt specifies appending (General Overview) for unverified/future events', apiSrc.includes('(General Overview)'));
assert('Prompt contains GIBBERISH fallback rule to "General Study Set"', apiSrc.includes('GIBBERISH') && apiSrc.includes('General Study Set'));
assert('Prompt specifies NO disclosure tags for gibberish', apiSrc.includes('Do NOT add disclosure tags to gibberish'));
assert('Prompt maintains 8 flashcards rule', apiSrc.includes('8 flashcards'));
assert('Prompt maintains 6 quiz questions rule', apiSrc.includes('6 quiz questions'));

console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log('🎉 AI honesty prompt rules fully verified!\n');
  process.exit(0);
} else {
  process.exit(1);
}
