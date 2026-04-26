const fs = require('fs');
const os = require('os');
const path = require('path');

function pluginRoot() {
  if (process.env.PLUGIN_ROOT) return process.env.PLUGIN_ROOT;
  if (process.env.CODEX_PLUGIN_ROOT) return process.env.CODEX_PLUGIN_ROOT;
  if (process.env.CLAUDE_PLUGIN_ROOT) return process.env.CLAUDE_PLUGIN_ROOT;
  return path.resolve(__dirname, '..');
}

function readStdin(timeoutMs = 5000) {
  return new Promise((resolve) => {
    let input = '';
    const timer = setTimeout(() => resolve(input), timeoutMs);
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      input += chunk;
    });
    process.stdin.on('end', () => {
      clearTimeout(timer);
      resolve(input);
    });
  });
}

function parseEvent(input) {
  if (!input || !input.trim()) return {};
  try {
    return JSON.parse(input);
  } catch {
    return { prompt: input };
  }
}

function projectDir(event = {}) {
  return (
    event.cwd ||
    event.project_dir ||
    event.workspace ||
    process.env.PROJECT_DIR ||
    process.env.CODEX_PROJECT_DIR ||
    process.env.CLAUDE_PROJECT_DIR ||
    process.cwd()
  );
}

function configFile(event = {}) {
  return path.join(projectDir(event), '.codex', 'llm-anti-cheating.local.md');
}

function readMode(event = {}) {
  const file = configFile(event);
  let mode = 'auto';
  let exists = false;
  try {
    exists = fs.existsSync(file);
    if (exists) {
      const content = fs.readFileSync(file, 'utf8');
      const modeMatch = content.match(/^mode:\s*([A-Za-z0-9_-]+)/m);
      if (modeMatch) mode = modeMatch[1];
    }
  } catch {
    // Default to auto if config cannot be read.
  }
  return { mode, exists, file };
}

function ensureDefaultConfig(event = {}) {
  const file = configFile(event);
  const { mode, exists } = readMode(event);
  if (exists) return { mode, file, created: false };

  const content = [
    '# LLM Anti-Cheating Settings',
    '',
    '---',
    'mode: auto',
    '---',
    '',
  ].join('\n');

  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content, 'utf8');
    return { mode: 'auto', file, created: true };
  } catch {
    return { mode, file, created: false };
  }
}

function writeMode(event = {}, nextMode = 'auto') {
  const file = configFile(event);
  const normalized = nextMode === 'manual' ? 'manual' : 'auto';
  const content = [
    '# LLM Anti-Cheating Settings',
    '',
    '---',
    `mode: ${normalized}`,
    '---',
    '',
  ].join('\n');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
  return { mode: normalized, file };
}

function pluginVersion() {
  try {
    const raw = fs.readFileSync(path.join(pluginRoot(), '.codex-plugin', 'plugin.json'), 'utf8');
    return JSON.parse(raw).version || '1.3.0-codex.2';
  } catch {
    return '1.3.0-codex.2';
  }
}

function sessionStateFile(event = {}) {
  const sessionId = String(
    event.session_id ||
    event.conversation_id ||
    process.env.SESSION_ID ||
    process.env.CODEX_SESSION_ID ||
    process.env.CLAUDE_SESSION_ID ||
    'unknown'
  )
    .replace(/[^A-Za-z0-9_.-]/g, '_')
    .slice(0, 120);
  return path.join(os.tmpdir(), `codex-llm-ac-session-${sessionId}.json`);
}

function readSessionState(event = {}) {
  const stateFile = sessionStateFile(event);
  try {
    if (fs.existsSync(stateFile)) {
      const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
      return {
        readFiles: Array.isArray(state.readFiles) ? state.readFiles : [],
        pendingVerify: Boolean(state.pendingVerify),
        editedFiles: Array.isArray(state.editedFiles) ? state.editedFiles : [],
      };
    }
  } catch {
    // Use default state.
  }
  return { readFiles: [], pendingVerify: false, editedFiles: [] };
}

function writeSessionState(event = {}, state = {}) {
  const normalized = {
    readFiles: Array.isArray(state.readFiles) ? state.readFiles : [],
    pendingVerify: Boolean(state.pendingVerify),
    editedFiles: Array.isArray(state.editedFiles) ? state.editedFiles : [],
  };
  fs.writeFileSync(sessionStateFile(event), JSON.stringify(normalized, null, 2), 'utf8');
}

function outputHook(hookEventName, additionalContext, extra = {}) {
  const output = {
    hookSpecificOutput: {
      hookEventName,
      additionalContext,
      ...extra,
    },
    additional_context: additionalContext,
  };
  process.stdout.write(JSON.stringify(output));
}

function outputSession(systemMessage, additionalContext) {
  const output = {
    systemMessage,
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext,
    },
    additional_context: additionalContext,
  };
  process.stdout.write(JSON.stringify(output));
}

module.exports = {
  configFile,
  ensureDefaultConfig,
  outputHook,
  outputSession,
  parseEvent,
  pluginRoot,
  pluginVersion,
  projectDir,
  readMode,
  readSessionState,
  readStdin,
  sessionStateFile,
  writeMode,
  writeSessionState,
};
