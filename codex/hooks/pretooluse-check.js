#!/usr/bin/env node
/**
 * PreToolUse Hook PoC: Enforce "Read before Write/Edit"
 * Uses file-based session state: /tmp/ac-session-{session_id}.json
 *
 * State schema: { readFiles: ["path1", "path2"], pendingVerify: false }
 *
 * Codex port note:
 * - Preserves upstream v1.3.0 behavior for Read/Write/Edit/Bash.
 * - Adds best-effort aliases for Codex tool names without changing upstream output text.
 */

const fs = require('fs');
const path = require('path');

function normalizeToolName(toolName) {
  if (!toolName) return '';
  const last = String(toolName).split('.').pop();
  if (last === 'view_image' || last === 'open') return 'Read';
  if (last === 'apply_patch') return 'Edit';
  if (last === 'exec_command' || last === 'write_stdin') return 'Bash';
  return last;
}

function extractFilePath(toolName, toolInput) {
  const direct = toolInput.file_path || toolInput.path || toolInput.target_file || toolInput.target || '';
  if (direct) return direct;

  // Best effort for apply_patch-like raw payloads. If no single target can be found,
  // return empty and let the hook pass through instead of blocking incorrectly.
  const payload = toolInput.patch || toolInput.input || toolInput.content || '';
  if (normalizeToolName(toolName) === 'Edit' && typeof payload === 'string') {
    const match = payload.match(/^\*\*\* (?:Update|Delete) File: (.+)$/m);
    return match ? match[1].trim() : '';
  }
  return '';
}

let inputData = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { inputData += chunk; });
process.stdin.on('end', () => {
  try {
    const event = JSON.parse(inputData);
    const sessionId = event.session_id || event.conversation_id || process.env.SESSION_ID || process.env.CODEX_SESSION_ID || 'unknown';
    const rawToolName = event.tool_name || event.name || event.tool || '';
    const toolName = normalizeToolName(rawToolName);
    const toolInput = event.tool_input || event.input || event.arguments || {};

    // State file per session
    const stateFile = `/tmp/ac-session-${String(sessionId).replace(/[^A-Za-z0-9_.-]/g, '_')}.json`;

    // Load or init state
    let state = { readFiles: [], pendingVerify: false };
    try {
      if (fs.existsSync(stateFile)) {
        state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
      }
    } catch (e) { /* use default */ }

    // Track Read calls
    if (toolName === 'Read') {
      const filePath = extractFilePath(rawToolName, toolInput);
      if (filePath && !state.readFiles.includes(filePath)) {
        state.readFiles.push(filePath);
      }
      // Save state and allow
      fs.writeFileSync(stateFile, JSON.stringify(state));
      process.exit(0);
    }

    // Check Write/Edit: was target file Read first?
    if (toolName === 'Write' || toolName === 'Edit' || toolName === 'MultiEdit' || toolName === 'NotebookEdit') {
      const targetFile = extractFilePath(rawToolName, toolInput);

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
          },
          additional_context: `Read "${targetFile}" first, then retry your edit.`
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
