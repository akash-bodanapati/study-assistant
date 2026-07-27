/**
 * test/test-stale-response-trigger.js
 * Explicitly triggers two rapid back-to-back requests to verify stale-response handling:
 * - Fires Request 1
 * - Fires Request 2 immediately (which aborts Request 1's AbortSignal)
 * - Verifies Request 1 resolves with { isCancelled: true, error: 'cancelled' }
 * - Verifies Request 2 completes normally without any cancellation or error UI.
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

console.log('\n[Item 3 Verification: Rapid Back-to-Back Submissions / Stale Response Trigger]');

// Simulate the App.jsx controller ref pattern
let activeController = null;

function triggerSubmit(topicText) {
  // Stale response protection (same logic as App.jsx handleSubmit)
  if (activeController) {
    activeController.abort();
  }
  const controller = new AbortController();
  activeController = controller;

  return generateStudySet(topicText, controller.signal);
}

// 1. Fire Request 1
const promiseReq1 = triggerSubmit('Topic 1 - Photosynthesis');

// 2. Immediately (synchronously) fire Request 2 before Request 1 finishes
const promiseReq2 = triggerSubmit('Topic 2 - Quantum Mechanics');

// 3. Await both promises
const [res1, res2] = await Promise.all([promiseReq1, promiseReq2]);

console.log('Result 1:', res1);
console.log('Result 2:', res2);

assert('Request 1 returned isCancelled: true', res1.isCancelled === true);
assert('Request 1 error is "cancelled" (App.jsx drops it silently with no error card)', res1.error === 'cancelled');
assert('Request 1 did NOT trigger timeout error', res1.isTimeout !== true);

assert('Request 2 is NOT cancelled', res2.isCancelled !== true);
assert('Request 2 does NOT have cancellation error', res2.error !== 'cancelled');

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log('🎉 Stale-response fix verified: Request 1 cancelled silently, Request 2 proceeds!\n');
  process.exit(0);
} else {
  process.exit(1);
}
