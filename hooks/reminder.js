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

// Build reminder message based on level with current settings
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

// Output as JSON with hookSpecificOutput (same format as superpowers)
const output = {
  hookSpecificOutput: {
    hookEventName: "UserPromptSubmit",
    additionalContext: reminder
  }
};

console.log(JSON.stringify(output));
