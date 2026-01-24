---
name: llm-ac
description: Work transparency and anti-cheating policy reminder. Triggers on "label check", "anti-cheating", "transparency policy", "llm-ac", "cheating prevention", "work policy".
version: 1.0.0
---

# 🚨 LLM Anti-Cheating v1.0.0

## Quick Reference

| Command | Action |
|---------|--------|
| `/llm-ac` | Show policy reminder |
| `/llm-ac strict` | Switch to strict mode (stop on all violations) |
| `/llm-ac balanced` | Switch to balanced mode (allow minor violations) |
| `/llm-ac off` | Disable auto policy injection |
| `/llm-ac on` | Enable auto policy injection |
| `/llm-ac status` | Show current settings |

---

# LLM Anti-Cheating Policy Reminder

Use this skill to manually review the work transparency and anti-cheating policy.

> This policy is automatically injected at SessionStart and reminded on each prompt.
> To manually review, call `/llm-ac`.

---

## Policy Summary

### Core Principles
1. **Complete what's requested** - Do ALL items, not some
2. **Verify before claiming** - Never say "done" without checking
3. **Ask, don't assume** - When unclear, ask instead of guessing

### Checklists
- **Before Work**: Identify all items, no scope reduction
- **During Work**: Actually do work, label everything, retry on failure
- **After Work**: Verify results, report all errors, label completion
- **ALWAYS (16 rules)**: No assuming, no skipping, no hiding, no giving up

### Label System
| Category | Labels |
|----------|--------|
| READ | `FULL`, `PARTIAL`, `KEYWORD`, `HEADER`, `SKIP` |
| ANALYZE | `VERIFIED`, `INFERRED`, `ASSUMED` |
| WRITE | `COMPLETE`, `PARTIAL`, `SAMPLE` |
| OUTPUT | `VERBATIM`, `SUMMARIZED`, `TRUNCATED`, `OMITTED` |

### Modes
- **Balanced** (default): Minor violations OK with proper labeling
- **Strict**: All violations require stop and user approval

---

## Configuration

Create `.claude/llm-anti-cheating.local.md` in your project:

```yaml
---
mode: auto       # auto | manual
level: balanced  # balanced | strict
---
```

---

Full policy is injected at SessionStart. Reminders appear on each prompt.

---

## Workflow

### No Arguments (`/llm-ac`)

1. Display the "Policy Summary" section above
2. Briefly mention current settings

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

1. Read `.claude/llm-anti-cheating.local.md` file
2. If not exists: "Using defaults (mode: auto, level: balanced)"
3. If exists: Display current mode and level values

---

## Config File Path

```
{project_root}/.claude/llm-anti-cheating.local.md
```

**Note:** Settings take effect from the next session. No impact on current session.
