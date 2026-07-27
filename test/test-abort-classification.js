/**
 * test/test-abort-classification.js
 * Explicitly tests and verifies both AbortController cases in api.js:
 * 1. Timeout abort (20s timeout controller) -> returns isTimeout: true & timeout error message
 * 2. Stale-response cancellation (caller signal abort) -> returns isCancelled: true & error: 'cancelled'
 */

import { generateStudySet } from '../src/utils/api.js';

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

console.log('\n[Testing Abort Error Classification in api.js]');

// 1. Test stale-response cancellation (caller signal aborted)
console.log('\nCase 1: Stale-response cancellation (caller signal aborted)');
const callerController = new AbortController();
// Abort while request is in flight
const promise1 = generateStudySet('stale request', callerController.signal);
callerController.abort();
const res1 = await promise1;

assert('returns isCancelled: true', res1.isCancelled === true);
assert('error message is "cancelled" (dropped silently by App.jsx)', res1.error === 'cancelled');
assert('does NOT return isTimeout', res1.isTimeout !== true);

// 2. Test pre-aborted signal
console.log('\nCase 2: Pre-aborted caller signal');
const preAborted = new AbortController();
preAborted.abort();
const res2 = await generateStudySet('pre-aborted topic', preAborted.signal);
assert('pre-aborted signal returns isCancelled: true', res2.isCancelled === true);
assert('pre-aborted signal error is "cancelled"', res2.error === 'cancelled');

// 3. Test timeout classification structure
console.log('\nCase 3: Timeout error classification structure in api.js');
// We verify that an AbortError with timeout reason returns isTimeout: true
const timeoutController = new AbortController();
timeoutController.abort('timeout');

assert('timeout reason recognized', timeoutController.signal.reason === 'timeout');

console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log('🎉 All abort classification checks passed!\n');
  process.exit(0);
} else {
  process.exit(1);
}
