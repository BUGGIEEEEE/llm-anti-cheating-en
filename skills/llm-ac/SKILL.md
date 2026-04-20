---
name: llm-ac
description: Work transparency and anti-cheating policy reminder. Triggers on "label check", "anti-cheating", "transparency policy", "llm-ac", "cheating prevention", "work policy".
version: 1.1.0
---

# 🚨 LLM Anti-Cheating v1.1.0

## Quick Reference

| Command | Action |
|---------|--------|
| `/llm-ac` | Show full policy (same as SessionStart) |
| `/llm-ac strict` | Switch to strict mode (stop on all violations) |
| `/llm-ac balanced` | Switch to balanced mode (allow minor violations) |
| `/llm-ac off` | Disable auto policy injection |
| `/llm-ac on` | Enable auto policy injection |
| `/llm-ac status` | Show current settings |

---

# Policy Source

The full policy is maintained in `hooks/policy-content.md` (single source of truth).

When `/llm-ac` is invoked without arguments, **read and display** the policy from:
```
${CLAUDE_PLUGIN_ROOT}/hooks/policy-content.md
```

Do NOT maintain a separate copy of the policy in this file.

---

# Skill Commands

## Workflow

### No Arguments (`/llm-ac`)

1. **MUST** start output with: "🚨 **LLM Anti-Cheating v1.1.0**"
2. Display the full policy above (same as SessionStart hook)
3. Briefly mention current settings

### With Arguments

#### `/llm-ac strict` or `/llm-ac balanced`

1. Check project's `.claude/llm-anti-cheating.local.md` file
2. Create if not exists, modify if exists
3. Change `level:` value to specified value
4. Output confirmation message

**Config file format:**
```markdown
# LLM Anti-Cheating Settings

---
mode: auto
level: {strict|balanced}
---
```

#### `/llm-ac off`

1. Set `mode: manual` in `.claude/llm-anti-cheating.local.md`
2. Inform that auto policy injection will be disabled from next session

#### `/llm-ac on`

1. Set `mode: auto` in `.claude/llm-anti-cheating.local.md`
2. Inform that auto policy injection will be enabled from next session

#### `/llm-ac status`

1. **MUST** start output with: "🚨 **LLM Anti-Cheating v1.1.0** - Status"
2. Read `.claude/llm-anti-cheating.local.md` file
3. If not exists: "Using defaults (mode: auto, level: balanced)"
4. If exists: Display current mode and level values

---

## Configuration

Create `.claude/llm-anti-cheating.local.md` in your project:

```yaml
---
mode: auto       # auto | manual
level: balanced  # balanced | strict
---
```

## Config File Path

```
{project_root}/.claude/llm-anti-cheating.local.md
```

**Note:** Settings take effect from the next session. No impact on current session.
