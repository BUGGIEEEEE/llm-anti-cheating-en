#!/usr/bin/env node
/**
 * PreToolUse Hook PoC: Enforce "Read before Write/Edit"
 * Uses file-based session state: /tmp/ac-session-{session_id}.json
 *
 * State schema: { readFiles: ["path1", "path2"], pendingVerify: false }
 */

const fs = require('fs');
const path = require('path');

let inputData = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { inputData += chunk; });
process.stdin.on('end', () => {
  try {
    const event = JSON.parse(inputData);
    const sessionId = event.session_id || 'unknown';
    const toolName = event.tool_name || '';
    const toolInput = event.tool_input || {};

    // State file per session
    const stateFile = `/tmp/ac-session-${sessionId}.json`;

    // Load or init state
    let state = { readFiles: [], pendingVerify: false };
    try {
      if (fs.existsSync(stateFile)) {
        state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
      }
    } catch (e) { /* use default */ }

    // Track Read calls
    if (toolName === 'Read') {
      const filePath = toolInput.file_path || '';
      if (filePath && !state.readFiles.includes(filePath)) {
        state.readFiles.push(filePath);
      }
      // Save state and allow
      fs.writeFileSync(stateFile, JSON.stringify(state));
      process.exit(0);
    }

    // Check Write/Edit: was target file Read first?
    if (toolName === 'Write' || toolName === 'Edit') {
      const targetFile = toolInput.file_path || '';

      // Exception: new file creation (file doesn't exist yet)
      if (targetFile && !fs.existsSync(targetFile)) {
        // New file — allow without Read
        state.pendingVerify = true;
        fs.writeFileSync(stateFile, JSON.stringify(state));
        process.exit(0);
      }

      // Check if file was Read in this session
      if (targetFile && !state.readFiles.includes(targetFile)) {
        // Block: file not read first
        const output = {
          hookSpecificOutput: {
            hookEventName: "PreToolUse",
            permissionDecision: "ask",
            permissionDecisionReason: `⚠️ You are modifying "${path.basename(targetFile)}" without reading it first. Read the file before editing.`,
            additionalContext: `Read "${targetFile}" first, then retry your edit.`
          }
        };
        console.log(JSON.stringify(output));
        fs.writeFileSync(stateFile, JSON.stringify(state));
        return;
      }

      // File was Read — allow, mark pending verification
      state.pendingVerify = true;
      fs.writeFileSync(stateFile, JSON.stringify(state));
      process.exit(0);
    }

    // Track Bash calls (clears pending verification)
    if (toolName === 'Bash') {
      if (state.pendingVerify) {
        state.pendingVerify = false;
      }
      fs.writeFileSync(stateFile, JSON.stringify(state));
      process.exit(0);
    }

    // All other tools: pass through
    fs.writeFileSync(stateFile, JSON.stringify(state));
    process.exit(0);

  } catch (err) {
    process.exit(0);
  }
});
