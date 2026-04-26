#!/usr/bin/env bash
set -euo pipefail

codex_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
repo_root="$(cd "$codex_root/.." && pwd)"
plugin="$codex_root"
tmpdir="$(mktemp -d)"

cleanup() {
  rm -rf "$tmpdir"
  rm -f /tmp/llm-ac-inject.out /tmp/llm-ac-reminder.out /tmp/llm-ac-pretool.out /tmp/llm-ac-stop.out
  find /tmp -maxdepth 1 -name 'ac-session-smoke-*' -delete 2>/dev/null || true
}
trap cleanup EXIT

cd "$repo_root"

echo "1. JSON manifests"
node -e "JSON.parse(require('fs').readFileSync('codex/.codex-plugin/plugin.json','utf8')); JSON.parse(require('fs').readFileSync('codex/hooks.json','utf8'));"

echo "2. Hook syntax"
node --check "$plugin/hooks/lib.js"
node --check "$plugin/hooks/inject-policy.js"
node --check "$plugin/hooks/reminder.js"
node --check "$plugin/hooks/pretooluse-check.js"
node --check "$plugin/hooks/stop-check.js"

echo "3. Upstream policy parity"
if [[ -f "$repo_root/upstream/hooks/policy-content.md" ]]; then
  diff -u "$repo_root/upstream/hooks/policy-content.md" "$plugin/hooks/policy-content.md" >/dev/null
elif [[ -f "$repo_root/hooks/policy-content.md" ]]; then
  diff -u "$repo_root/hooks/policy-content.md" "$plugin/hooks/policy-content.md" >/dev/null
fi

echo "4. Skill validation"
python3 /Users/buggie/.codex/skills/.system/skill-creator/scripts/quick_validate.py "$plugin/skills/llm-ac" >/dev/null

echo "5. Hook smoke tests"
printf 'x\n' > "$tmpdir/existing.txt"

(
  cd "$plugin"
  printf '%s' "{\"cwd\":\"$tmpdir\"}" \
    | node ./hooks/inject-policy.js >/tmp/llm-ac-inject.out

  printf '%s' "{\"cwd\":\"$tmpdir\",\"prompt\":\"quick fix this bug and verify tests\"}" \
    | node ./hooks/reminder.js >/tmp/llm-ac-reminder.out

  printf '%s' "{\"cwd\":\"$tmpdir\",\"session_id\":\"smoke-pretool\",\"tool_name\":\"Edit\",\"tool_input\":{\"file_path\":\"$tmpdir/existing.txt\"}}" \
    | node ./hooks/pretooluse-check.js >/tmp/llm-ac-pretool.out

  printf '%s' "{\"cwd\":\"$tmpdir\",\"session_id\":\"smoke-stop\",\"assistantMessage\":\"[WRITE:COMPLETE: 1 item] Fixed and verified.\"}" \
    | node ./hooks/stop-check.js >/tmp/llm-ac-stop.out
)

node - <<'NODE'
const fs = require('fs');
for (const [name, file] of Object.entries({
  inject: '/tmp/llm-ac-inject.out',
  reminder: '/tmp/llm-ac-reminder.out',
  pretool: '/tmp/llm-ac-pretool.out',
  stop: '/tmp/llm-ac-stop.out',
})) {
  const raw = fs.readFileSync(file, 'utf8');
  JSON.parse(raw);
  console.log(`${name} ok`);
}
NODE

echo "port verification ok"
