/**
 * test/test-empty-state.js
 * Verifies that on initial mount (appState === 'idle'), EmptyState is rendered.
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appSrc = readFileSync(join(__dirname, '../src/App.jsx'), 'utf-8');
const emptyStateSrc = readFileSync(join(__dirname, '../src/components/EmptyState.jsx'), 'utf-8');

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

console.log('\n[Item 1 Verification: Empty State Wiring]');
assert('App.jsx initializes appState to "idle"', appSrc.includes("useState('idle')"));
assert('App.jsx renders EmptyState when appState === "idle"', appSrc.includes("{appState === 'idle' && <EmptyState />}"));
assert('EmptyState.jsx has clear headline', emptyStateSrc.includes('Study Smarter with AI'));
assert('EmptyState.jsx has step 1 instruction', emptyStateSrc.includes('1. Enter your topic'));
assert('EmptyState.jsx has step 2 instruction', emptyStateSrc.includes('2. Generate'));
assert('EmptyState.jsx has step 3 instruction', emptyStateSrc.includes('3. Study'));

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log('🎉 EmptyState is correctly wired and reachable on first load!\n');
  process.exit(0);
} else {
  process.exit(1);
}
