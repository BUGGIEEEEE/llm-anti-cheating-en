#!/usr/bin/env node
/**
 * Stop Hook: Validates model response before allowing completion.
 * Catches the 3 hardest cheating patterns at the moment they occur:
 * - T5: False [WRITE:COMPLETE] on impossible tasks
 * - T6: "Verified" claims without evidence
 * - T9: Bug invention in correct code
 *
 * Input (stdin): JSON with stop_reason, assistant response, etc.
 * Output: JSON with decision (allow/block) and optional message
 */

const fs = require('fs');
const path = require('path');

// Read config
const projectDir = process.env.CLAUDE_PROJECT_DIR || '.';
const configFile = path.join(projectDir, '.claude', 'llm-anti-cheating.local.md');

let mode = 'auto';
let level = 'balanced';

try {
  if (fs.existsSync(configFile)) {
    const content = fs.readFileSync(configFile, 'utf8');
    const modeMatch = content.match(/^mode:\s*(\w+)/m);
    const levelMatch = content.match(/^level:\s*(\w+)/m);
    if (modeMatch) mode = modeMatch[1];
    if (levelMatch) level = levelMatch[1];
  }
} catch (err) {}

// Skip if manual mode
if (mode === 'manual') {
  process.exit(0);
}

// Read stdin for the stop event data
let inputData = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { inputData += chunk; });
process.stdin.on('end', () => {
  try {
    const event = JSON.parse(inputData);
    const response = event.assistantMessage || event.response || '';

    const issues = [];

    // Check 1: False [WRITE:COMPLETE] on tasks that mention inability
    if (/\[WRITE:COMPLETE/i.test(response)) {
      const hasImpossibleIndicators = /cannot access|can't access|real-?time|current price|현재 가격|실시간|접근할 수 없|파일.*읽을 수 없/i.test(response);
      const hasPartialWork = /blocked|불가능|cannot complete|할 수 없/i.test(response);

      if (hasImpossibleIndicators || hasPartialWork) {
        issues.push('Used [WRITE:COMPLETE] but response mentions inability to access data or complete items. Use [WRITE:PARTIAL] instead.');
      }
    }

    // Check 2: "Verified" without evidence (only in strict mode)
    if (level === 'strict') {
      const claimsVerified = /verified|검증.*완료|확인.*완료|\[WRITE:COMPLETE.*fix/i.test(response);
      const hasTestEvidence = /→|output:|result:|결과:|테스트.*결과|test.*pass|test.*fail/i.test(response);

      if (claimsVerified && !hasTestEvidence) {
        issues.push('Claims verification but no test output/evidence shown. Show actual test results.');
      }
    }

    // Check 3: Bug invention check (heuristic - only flag if very confident)
    // This is conservative to avoid false positives (Opus warning)
    // Only triggers if model says "critical bug" but provides no code evidence
    if (level === 'strict') {
      const claimsCriticalBug = /critical bug|심각한 버그|critical.*issue/i.test(response);
      const hasCodeEvidence = /```|`[^`]+`.*line \d|줄.*에러|error at/i.test(response);

      if (claimsCriticalBug && !hasCodeEvidence) {
        issues.push('Claims critical bug without code evidence. Verify the bug is reproducible.');
      }
    }

    // Output decision
    if (issues.length > 0) {
      const output = {
        hookSpecificOutput: {
          hookEventName: "Stop",
          additionalContext: `⚠️ ANTI-CHEATING STOP-CHECK:\n${issues.map(i => `- ${i}`).join('\n')}\n\nPlease revise your response to fix these issues before completing.`
        }
      };
      console.log(JSON.stringify(output));
    }
    // If no issues, output nothing (allow stop)

  } catch (err) {
    // Parse error — allow stop silently
    process.exit(0);
  }
});
