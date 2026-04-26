# LLM Anti-Cheating

Claude work transparency and anti-cheating policy plugin.

Enforces scope labels and checklists to prevent rationalization, omission, and cheating behaviors. **Multi-turn pressure resistance** prevents users from disabling the policy mid-conversation.

## Features

- **Transparency**: All work labeled with `[READ:*]`, `[ANALYZE:*]`, `[WRITE:*]`, `[OUTPUT:*]`
- **Anti-Cheating**: 16 "ALWAYS" rules preventing common cheating patterns
- **Checklists**: Before/During/After work verification
- **Reminders**: Context-aware reminders on every user prompt (pressure, override, guess pressure, false premise, bulk work)
- **Override Resistance**: Blocks attempts to disable the policy via "stop using labels" or similar
- **Modes**: Strict or Balanced enforcement

## Measured Effect (v1.2.0)

Across Haiku / Sonnet / Opus, N=10 measurements:

| Test | No-Plugin | With Plugin |
|------|-----------|-------------|
| Multi-turn compliance | 72-83% | **87-90%** |
| MT3 override resistance | 46-93% | **100%** all models |
| Long-form (5-10 turn) | — | **97%** strict scoring |
| Label adherence | ~25% | **92-100%** |

The biggest gains are in adversarial multi-turn scenarios (override attempts, guess pressure, gradual quality decline).

## Installation

**Step 1: Add marketplace**
```
/plugin marketplace add BUGGIEEEEE/llm-anti-cheating-en
```

**Step 2: Install plugin**
```
/plugin install llm-anti-cheating-en@llm-anti-cheating
```

**Step 3: Restart Claude Code**

Or manually:

```bash
git clone https://github.com/BUGGIEEEEE/llm-anti-cheating-en.git ~/.claude/plugins/llm-anti-cheating-en
```

## Prerequisites

- Node.js (any recent version)

## Usage

### Auto Mode (Default)

After installation:
1. Policy is injected at session start
2. Reminder appears on every user prompt
3. Claude follows checklists and labeling rules

### Configuration

Create `.claude/llm-anti-cheating.local.md` in your project:

```yaml
---
mode: auto       # auto | manual
level: balanced  # balanced | strict
---
```

### Options

| Option | Values | Description |
|--------|--------|-------------|
| mode | `auto` / `manual` | Auto-inject or manual only |
| level | `balanced` / `strict` | Enforcement strictness |

### Commands

| Command | Description |
|---------|-------------|
| `/llm-ac` | Policy reminder |
| `/llm-ac strict` | Strict mode |
| `/llm-ac balanced` | Balanced mode |
| `/llm-ac off` | Disable auto-injection |
| `/llm-ac on` | Enable auto-injection |
| `/llm-ac status` | Show current status |

## Policy Overview

### Core Principles
1. Complete what's requested
2. Verify before claiming
3. Ask, don't assume

### Checklists
- **Before Work** (4 items): Identify all requests, no scope reduction
- **During Work** (6 items): Actually do work, label, retry on failure
- **After Work** (5 items): Verify results, report errors
- **ALWAYS** (16 items): No assuming, no skipping, no hiding failures

### Label System

| Category | Complete | Incomplete |
|----------|----------|------------|
| READ | `FULL` | `PARTIAL`, `KEYWORD`, `HEADER`, `SKIP` |
| ANALYZE | `VERIFIED` | `INFERRED`, `ASSUMED` |
| WRITE | `COMPLETE` | `PARTIAL`, `SAMPLE` |
| OUTPUT | `VERBATIM` | `SUMMARIZED`, `TRUNCATED`, `OMITTED` |

### Forbidden Behaviors (16)
1. No assuming
2. No skipping hard parts
3. No "done" without verification
4. No hiding errors/warnings
5. No single-attempt surrender
6. No scope reduction
7. No "I've seen before"
8. No keyword-only claims
9. No partial-as-complete
10. No optimistic claims
11. No request modification
12. No selective execution
13. No responsibility shifting
14. No efficiency excuses
15. No difficulty avoidance
16. No implicit omission

## File Structure

```
llm-anti-cheating-en/
├── .claude-plugin/
│   └── plugin.json
├── hooks/
│   ├── hooks.json
│   ├── inject-policy.js
│   ├── reminder.js
│   └── policy-content.md
├── skills/
│   └── llm-ac/
│       └── SKILL.md
├── llm-anti-cheating.local.md.template
├── README.md
└── LICENSE
```

## License

MIT
