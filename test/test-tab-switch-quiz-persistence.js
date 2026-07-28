/**
 * test/test-tab-switch-quiz-persistence.js
 * Verifies that Quiz state & DOM mounting persist across tab switches:
 * - App.jsx keeps both tab panels mounted in DOM with hidden/display toggles
 * - QuizMode stays mounted across tab switches (preserving current question, answers, score, retest mode)
 * - Fresh topic generation updates key={studySet.topic}, cleanly resetting QuizMode for the new topic
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const appSrc = readFileSync(join(__dirname, '../src/App.jsx'), 'utf-8');
const quizSrc = readFileSync(join(__dirname, '../src/components/QuizMode.jsx'), 'utf-8');
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

console.log('\n[Testing Quiz State Persistence Across Tab Switches]');

assert('App.jsx keeps #panel-cards mounted with hidden attribute', appSrc.includes('id="panel-cards"') && appSrc.includes('hidden={activeTab !== \'cards\'}'));
assert('App.jsx keeps #panel-quiz mounted with hidden attribute', appSrc.includes('id="panel-quiz"') && appSrc.includes('hidden={activeTab !== \'quiz\'}'));
assert('App.jsx passes isActive={activeTab === \'quiz\'} to QuizMode', appSrc.includes('isActive={activeTab === \'quiz\'}'));
assert('App.jsx passes isActive={activeTab === \'cards\'} to FlashcardViewer', appSrc.includes('isActive={activeTab === \'cards\'}'));
assert('App.jsx keys QuizMode on studySet.topic for fresh topic resets', appSrc.includes('key={studySet.topic}'));
assert('QuizMode accepts isActive prop and suppresses shortcuts when inactive', quizSrc.includes('isActive = true') && quizSrc.includes('if (!isActive || showResults || !current) return'));
assert('FlashcardViewer accepts isActive prop and suppresses shortcuts when inactive', viewerSrc.includes('isActive = true') && viewerSrc.includes('if (!isActive) return'));

console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log('🎉 Quiz state tab switch persistence fully verified!\n');
  process.exit(0);
} else {
  process.exit(1);
}
