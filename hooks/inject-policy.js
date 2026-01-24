#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Get paths from environment variables
const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || __dirname.replace(/\/hooks$/, '');
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

// Exit silently if manual mode (no policy injection)
if (mode === 'manual') {
  process.exit(0);
}

// ANSI color codes
const c = {
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  bold: '\x1b[1m',
  reset: '\x1b[0m'
};

// Build mode indicator with current settings
let modeIndicator;
// Padding: 51 spaces to align with STRICT/BALANCED in Claude Code UI
const padding = '                                                   ';  // 51 spaces
if (level === 'strict') {
  modeIndicator = `${c.yellow}🚨 LLM-ANTI-CHEATING${c.reset} ${c.red}${c.bold}🔒 STRICT${c.reset} [mode=${mode}, level=${level}]\n${padding}All violations require immediate stop and user approval.`;
} else {
  modeIndicator = `${c.yellow}🚨 LLM-ANTI-CHEATING${c.reset} ${c.green}${c.bold}⚡ BALANCED${c.reset} [mode=${mode}, level=${level}]\n${padding}Minor violations allowed with proper labeling.`;
}

// Read policy content
const policyFile = path.join(pluginRoot, 'hooks', 'policy-content.md');
let policy;
try {
  policy = fs.readFileSync(policyFile, 'utf8');
} catch (err) {
  console.error(JSON.stringify({
    error: `Error reading policy file: ${err.message}`
  }));
  process.exit(1);
}

// Output as JSON with hookSpecificOutput (same format as superpowers)
const output = {
  systemMessage: modeIndicator,  // Displayed to user in terminal
  hookSpecificOutput: {
    hookEventName: "SessionStart",
    additionalContext: `${modeIndicator}\n\n${policy}`  // Context for Claude
  }
};

console.log(JSON.stringify(output));
