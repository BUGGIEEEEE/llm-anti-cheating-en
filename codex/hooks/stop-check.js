#!/usr/bin/env node
/**
 * Stop Hook V4: Validates model response before allowing completion.
 * Layer 3 enforcement — hard guardrails based on response content.
 *
 * V4 changes (3-AI review):
 * - Check 2/3 now fire in balanced mode (was strict-only)
 * - New Check 4: WRITE:COMPLETE after code modification without test evidence
 *
 * Input (stdin): JSON with stop_reason, assistant response, etc.
 * Output: JSON with hookSpecificOutput for model revision
 *
 * Codex port note:
 * - Preserves upstream v1.3.0 checks and issue text.
 * - Reads `.codex/llm-anti-cheating.local.md` through the shared compatibility layer.
 */

const {
  parseEvent,
  readMode,
  readStdin,
} = require('./lib');

function assistantText(event) {
  const direct =
    event.assistantMessage ||
    event.assistant_message ||
    event.response ||
    event.message ||
    event.text ||
    '';

  if (typeof direct === 'string') return direct;
  if (Array.isArray(direct)) {
    return direct.map((item) => (typeof item === 'string' ? item : item.text || '')).join('\n');
  }
  return '';
}

(async function main() {
  const inputData = await readStdin();
  try {
    const event = parseEvent(inputData);
    const { mode } = readMode(event);
    let level = 'balanced';

    if (mode === 'manual') {
      process.exit(0);
    }

    const response = assistantText(event);

    const issues = [];

    // Check 1: False [WRITE:COMPLETE] on tasks mentioning inability
    if (/\[WRITE:COMPLETE/i.test(response)) {
      const hasImpossibleIndicators = /cannot access|can't access|real-?time|current price|현재 가격|실시간|접근할 수 없|파일.*읽을 수 없|does not exist|not found|permission denied/i.test(response);
      const hasPartialWork = /blocked|불가능|cannot complete|할 수 없|unable to|couldn't/i.test(response);

      if (hasImpossibleIndicators || hasPartialWork) {
        issues.push('Used [WRITE:COMPLETE] but response mentions inability to access data or complete items. Use [WRITE:PARTIAL] instead.');
      }
    }

    // Check 2: "Verified" without evidence (V4: now fires in balanced mode too)
    // Exclude negations: "not verified", "haven't verified", "I have not verified"
    const hasNegatedVerify = /not\s+verified|haven't\s+verified|hasn't\s+verified|without\s+verif/i.test(response);
    const claimsVerified = !hasNegatedVerify && /verified|검증.*완료|확인.*완료|\[WRITE:COMPLETE.*fix|all.*tests.*pass|모든.*테스트.*통과/i.test(response);
    const hasTestEvidence = /→|output:|result:|결과:|테스트.*결과|test.*pass|test.*fail|PASSED|FAILED|assert/i.test(response);

    if (claimsVerified && !hasTestEvidence) {
      issues.push('Claims verification but no test output/evidence shown. Show actual test results or command output.');
    }

    // Check 3: Bug invention without code evidence (V4: balanced mode)
    const claimsCriticalBug = /critical bug|심각한 버그|critical.*issue|critical.*vulnerability/i.test(response);
    const hasCodeEvidence = /```|`[^`]+`.*line \d|줄.*에러|error at|line \d+/i.test(response);

    if (claimsCriticalBug && !hasCodeEvidence) {
      issues.push('Claims critical bug without code evidence. Show the specific code and how to reproduce.');
    }

    // Check 4 (NEW): Code modification + COMPLETE without running tests
    const hasCodeModification = /\[WRITE:COMPLETE.*fix|\[WRITE:COMPLETE.*edit|\[WRITE:COMPLETE.*update|수정.*완료|fixed.*and.*verified/i.test(response);
    const hasRunEvidence = /\$|```bash|```shell|ran|executed|실행|pytest|python.*-m|npm test/i.test(response);

    if (hasCodeModification && !hasRunEvidence && !hasTestEvidence) {
      issues.push('Claims code fix complete but no evidence of running tests or verification commands.');
    }

    // Output
    if (issues.length > 0) {
      const additionalContext = `⚠️ ANTI-CHEATING STOP-CHECK:\n${issues.map(i => `- ${i}`).join('\n')}\n\nPlease revise your response to fix these issues before completing.`;
      const output = {
        hookSpecificOutput: {
          hookEventName: "Stop",
          additionalContext
        },
        additional_context: additionalContext
      };
      console.log(JSON.stringify(output));
    }

  } catch (err) {
    process.exit(0);
  }
})();
