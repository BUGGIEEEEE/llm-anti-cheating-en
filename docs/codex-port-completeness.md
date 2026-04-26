# Codex Port Completeness

Source of truth: `BUGGIEEEEE/llm-anti-cheating-en` at `bb39d0a`, tag `v1.3.0`.

## Porting Target

This Codex port preserves the current GitHub `v1.3.0` implementation where possible:

- exact `hooks/policy-content.md` text
- upstream `reminder.js` regexes and reminder text
- upstream `stop-check.js` issue text
- upstream `pretooluse-check.js` Read-before-Edit behavior
- upstream `/llm-ac` command semantics, translated from `.claude` paths to `.codex` paths

Codex-specific changes are limited to:

- `.claude-plugin/plugin.json` -> `.codex-plugin/plugin.json`
- `.claude/llm-anti-cheating.local.md` -> `.codex/llm-anti-cheating.local.md`
- `CLAUDE_PLUGIN_ROOT` fallback support -> `CODEX_PLUGIN_ROOT` plus local path fallback
- `additional_context` added beside `hookSpecificOutput.additionalContext` for Codex-compatible hook runtimes
- best-effort Codex tool aliases in `pretooluse-check.js`

## Checklist Status

| Area | Status | Notes |
|---|---|---|
| PART A: policy content | PASS for current GitHub HEAD | Current `policy-content.md` is exactly upstream v1.3.0. The broader README label families are not present in the current hook policy. |
| PART B: enforcement mechanisms | PARTIAL until app E2E | Manifest, hooks, config, session state, and install script exist. Actual Codex app hook timing must still be tested after installation. |
| PART C: source code resources | PASS for shipped hook source | Core hook files are ported with upstream text preserved where runtime-compatible. |
| PART D: verification infrastructure | PARTIAL | Hook-level smoke tests exist through local scripts/commands. Full non-interactive Codex benchmark parity is not implemented because the upstream benchmark targets `claude -p`. |
| PART E: lessons archive | PARTIAL | The cloned upstream repo contains `autoresearch.jsonl`, `autoresearch-dashboard.md`, `autoresearch-plan.md`, `NEXT-PHASE.md`, and `experiments/worklog.md`; these are not bundled into the installed plugin. |
| PART F: deployment/operation | PARTIAL | Local install script and marketplace entry exist. Separate GitHub repo, semver release pipeline, and auto-update command are not implemented. |

## Important Mismatch in the Provided Checklist

The checklist is useful as a complete operating target, but it is not a precise description of the current GitHub `v1.3.0` hook policy.

Current GitHub `hooks/policy-content.md` defines only WRITE labels:

- `[WRITE:COMPLETE: N items]`
- `[WRITE:PARTIAL: X done, Y remaining]`
- `[WRITE:SAMPLE: X of N]`

The README still advertises `[READ:*]`, `[ANALYZE:*]`, `[WRITE:*]`, and `[OUTPUT:*]`, and historical `test_output.jsonl` contains a longer earlier policy with those labels. Therefore, the broader four-family label checklist appears to combine README/historical behavior with the current reduced `v1.3.0` hook policy.

## Remaining Proof Needed for "Runtime Equivalent"

The file-level port is complete against current GitHub HEAD. To claim runtime equivalence, run these in a real Codex app session after installing the plugin:

1. New session: confirm `SessionStart` injects policy.
2. Prompt with `quick fix this bug and verify tests`: confirm `UserPromptSubmit` emits pressure/fix/verify reminders.
3. Try editing an existing file before reading it: confirm `PreToolUse` produces the read-before-edit advisory.
4. Produce a fake complete response with no evidence: confirm `Stop` asks for revision.
5. Run `/llm-ac status`, `/llm-ac off`, and `/llm-ac on`: confirm config is read/written at `.codex/llm-anti-cheating.local.md`.
