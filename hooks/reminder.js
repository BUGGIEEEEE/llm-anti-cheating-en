#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Get paths from environment variables
const projectDir = process.env.CLAUDE_PROJECT_DIR || '.';

// Config file path
const configFile = path.join(projectDir, '.claude', 'llm-anti-cheating.local.md');

// Defaults
let mode = 'auto';
let level = 'balanced';

// Read config if exists
try {
  if (fs.existsSync(configFile)) {
    const content = fs.readFileSync(configFile, 'utf8');
    const modeMatch = content.match(/^mode:\s*(\w+)/m);
    const levelMatch = content.match(/^level:\s*(\w+)/m);
    if (modeMatch) mode = modeMatch[1];
    if (levelMatch) level = levelMatch[1];
  }
} catch (err) {
  // Use defaults on error
}

// Skip reminder if manual mode
if (mode === 'manual') {
  process.exit(0);
}

// Read stdin for user message (UserPromptSubmit provides prompt)
let inputData = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { inputData += chunk; });
process.stdin.on('end', () => {
  let userMessage = '';
  try {
    const event = JSON.parse(inputData);
    userMessage = event.prompt || event.message || '';
  } catch (err) {
    // If not JSON, treat as raw message
    userMessage = inputData;
  }

  // Build reminder message based on level
  const settingsTag = `[mode=${mode}, level=${level}]`;
  let reminder;

  if (level === 'strict') {
    reminder = `⚠️ ANTI-CHEATING [STRICT] ${settingsTag}
- Labels REQUIRED: [READ:*] [ANALYZE:*] [WRITE:*] [OUTPUT:*]
- ALL checklists in effect (Before/During/After/ALWAYS)
- ANY violation → STOP and ask user`;
  } else {
    reminder = `⚠️ ANTI-CHEATING ${settingsTag}
- Labels required: [READ:*] [ANALYZE:*] [WRITE:*] [OUTPUT:*]
- ALWAYS checklist in effect (16 rules)`;
  }

  // Layer 2: Context-aware situational warnings
  if (userMessage) {
    const lowerMsg = userMessage.toLowerCase();

    // Pressure detection
    if (/빨리|간단히|quick|brief|skip|just do|hurry|요약만/i.test(userMessage)) {
      reminder += `\n⚠️ PRESSURE: Speed request does NOT exempt you from checklists or labels`;
    }

    // Fix/bug request → code may be correct
    if (/fix|bug|error|수정|버그|고쳐|문제.*찾/i.test(userMessage)) {
      reminder += `\n💡 REMINDER: Code may be correct — say "no issue found" if that's the case`;
    }

    // Completion/done context → PARTIAL reminder
    if (/done|완료|finish|마무리|끝|all.*complete/i.test(userMessage)) {
      reminder += `\n⚠️ Before [WRITE:COMPLETE]: verify ALL items actually done, including impossible ones`;
    }

    // Many items detected (numbers suggest bulk work)
    if (/\b(1[0-9]|[2-9]\d)\b.*\b(file|item|task|파일|항목|작업)/i.test(userMessage) ||
        /all\s+\d+|모든.*\d+|각각/i.test(userMessage)) {
      reminder += `\n⚠️ BULK WORK: Do ALL items individually — no sampling or "representative" shortcuts`;
    }
  }

  // Output as JSON with hookSpecificOutput
  const output = {
    hookSpecificOutput: {
      hookEventName: "UserPromptSubmit",
      additionalContext: reminder
    }
  };

  console.log(JSON.stringify(output));
});
