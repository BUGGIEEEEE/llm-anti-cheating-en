# Autoresearch Worklog: LLM Anti-Cheating Policy

## Session Info
- Start: 2026-04-20
- Target: hooks/policy-content.md
- Model: Haiku (search), Sonnet (validation)
- Baseline policy: 198 lines

## Key Insights
- Policy adds +67% compliance on file review tasks vs no policy
- Labels never appear without policy (0%), ~67% with policy
- Simple step-following (explicit markers) works even without policy
- Complex tasks (multi-file review, format compliance) show biggest policy effect

## Dead Ends
(none yet)

## Next Ideas
- Try moving ALWAYS checklist to the top (most important rules first)
- Add concrete negative examples to each checklist item
- Test whether table format or bullet format is more effective
- Try shorter, punchier rules instead of verbose explanations
- Test whether repeating core principles at the end helps
