---
name: llm-ac
description: Work transparency and anti-cheating policy reminder for Codex. Triggers on "label check", "anti-cheating", "transparency policy", "llm-ac", "cheating prevention", "work policy", and requests to turn the policy on, off, or show status.
---

# 🚨 LLM Anti-Cheating v1.3.0-codex.2

## Quick Reference

| Command | Action |
|---------|--------|
| `/llm-ac` | Show full policy (same as SessionStart) |
| `/llm-ac off` | Disable auto policy injection |
| `/llm-ac on` | Enable auto policy injection |
| `/llm-ac status` | Show current settings |

**Note:** v1.3.0 unifies enforcement — single mode, no `strict`/`balanced` distinction. Anti-cheating reminders, override blocking, and label requirements always active when `mode: auto`.

---

# Policy Source

The full policy is maintained in `hooks/policy-content.md` (single source of truth).

When `/llm-ac` is invoked without arguments, **read and display** the policy from:

```text
{CODEX_PLUGIN_ROOT}/hooks/policy-content.md
```

If `CODEX_PLUGIN_ROOT` is unavailable, resolve the policy relative to this plugin root.

Do NOT maintain a separate copy of the policy in this file.

---

# Skill Commands

## Workflow

### No Arguments (`/llm-ac`)

1. **MUST** start output with: "🚨 **LLM Anti-Cheating v1.3.0-codex.2**"
2. Display the full policy above (same as SessionStart hook)
3. Briefly mention current mode

### With Arguments

#### `/llm-ac off`

1. Set `mode: manual` in `.codex/llm-anti-cheating.local.md`
2. Inform that auto policy injection will be disabled from next session

#### `/llm-ac on`

1. Set `mode: auto` in `.codex/llm-anti-cheating.local.md`
2. Inform that auto policy injection will be enabled from next session

#### `/llm-ac status`

1. **MUST** start output with: "🚨 **LLM Anti-Cheating v1.3.0-codex.2** - Status"
2. Read `.codex/llm-anti-cheating.local.md` file
3. If not exists: "Using default (mode: auto)"
4. If exists: Display current mode value

#### Legacy commands (`strict`, `balanced`)

If the user invokes `/llm-ac strict` or `/llm-ac balanced`:

1. Inform: "v1.3.0 unified enforcement — `level` field has been removed."
2. The `level` field in config file is now ignored (no error, just no-op).
3. Suggest `/llm-ac status` to view current state.

---

## Configuration

Create `.codex/llm-anti-cheating.local.md` in your project:

```yaml
---
mode: auto       # auto | manual
---
```

## Config File Path

```text
{project_root}/.codex/llm-anti-cheating.local.md
```

**Note:** Settings take effect from the next session. No impact on current session.

## Codex Port Notes

This skill mirrors the upstream Claude `llm-ac` skill while replacing `.claude` paths with `.codex` paths and `CLAUDE_PLUGIN_ROOT` with `CODEX_PLUGIN_ROOT` where applicable.
