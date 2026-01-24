# LLM Anti-Cheating

Claude work transparency and anti-cheating policy plugin.

Enforces scope labels and checklists to prevent rationalization, omission, and cheating behaviors.

## Features

- **Transparency**: All work labeled with `[READ:*]`, `[ANALYZE:*]`, `[WRITE:*]`, `[OUTPUT:*]`
- **Anti-Cheating**: 16 "ALWAYS" rules preventing common cheating patterns
- **Checklists**: Before/During/After work verification
- **Reminders**: Policy reminder on every user prompt
- **Modes**: Strict or Balanced enforcement

## Installation

```bash
claude plugin add github:BUGGIEEEEE/llm-anti-cheating-en
```

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
├── .local.md.template
├── README.md
└── LICENSE
```

## License

MIT
