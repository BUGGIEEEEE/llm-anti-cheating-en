#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Get paths from environment variables
const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || __dirname.replace(/\/hooks$/, '');
const projectDir = process.env.CLAUDE_PROJECT_DIR || '.';

// Read plugin version from plugin.json
let version = '1.0.0';
try {
  const pluginJson = JSON.parse(fs.readFileSync(path.join(pluginRoot, '.claude-plugin', 'plugin.json'), 'utf8'));
  version = pluginJson.version || version;
} catch (err) {
  // Use default version on error
}

// Config file path
const configFile = path.join(projectDir, '.claude', 'llm-anti-cheating.local.md');

// Defaults
let mode = 'auto';
let level = 'balanced';
let isFirstRun = false;

// Read config if exists, create if not
try {
  if (fs.existsSync(configFile)) {
    const content = fs.readFileSync(configFile, 'utf8');
    const modeMatch = content.match(/^mode:\s*(\w+)/m);
    const levelMatch = content.match(/^level:\s*(\w+)/m);
    if (modeMatch) mode = modeMatch[1];
    if (levelMatch) level = levelMatch[1];
  } else {
    // First run - try to create default config file
    const defaultConfig = `# LLM Anti-Cheating Settings

---
mode: auto
level: balanced
---
`;
    try {
      fs.mkdirSync(path.dirname(configFile), { recursive: true });
      fs.writeFileSync(configFile, defaultConfig);
      isFirstRun = true;  // Only set true if file creation succeeds
    } catch (writeErr) {
      // File creation failed (permission issue, etc.) - still show first run message
      isFirstRun = true;
    }
  }
} catch (err) {
  // Config read failed - treat as first run
  isFirstRun = true;
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
let systemMessage;
// Padding: 51 spaces to align with STRICT/BALANCED in Claude Code UI
const padding = '                                                   ';  // 51 spaces

if (isFirstRun) {
  // First run welcome message
  modeIndicator = `${c.green}${c.bold}🎉 LLM Anti-Cheating Plugin v${version} Installed!${c.reset}

${c.yellow}Commands:${c.reset}
  /llm-ac          - Show policy reminder
  /llm-ac status   - Check current settings
  /llm-ac strict   - Enable strict mode
  /llm-ac balanced - Enable balanced mode
  /llm-ac off      - Disable auto-injection
  /llm-ac on       - Enable auto-injection

${c.yellow}Config:${c.reset} .claude/llm-anti-cheating.local.md
${c.yellow}Current:${c.reset} mode=${mode}, level=${level}`;
} else if (level === 'strict') {
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
