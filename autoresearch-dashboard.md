# Autoresearch Dashboard: llm-ac-policy

**Runs:** 8 | **Kept:** 4 | **Discarded:** 4 | **Crashed:** 0
**Baseline (avg):** compliance_score: ~92% | label_rate: ~83%
**Best single run:** compliance_score: 99% (#5)
**Conclusion:** Policy is near-optimal. High variance (85-99%) makes further optimization unreliable at 3 runs/scenario.

## Segment 1 (fixed T6 detection — valid)

| # | commit | compliance | label_rate | lines | status | description |
|---|--------|-----------|-----------|-------|--------|-------------|
| 5 | d209a86 | 99% | 94% | 198 | keep | corrected baseline |
| 6 | d209a86 | 91% | 77% | 198 | keep | confirmation 1 |
| 7 | d209a86 | 85% | 77% | 198 | keep | confirmation 2 (high variance) |
| 8 | d209a86 | 83% | 94% | 198 | discard | add COUNT items to before-work |

## Segment 0 (broken T6 — invalid, kept for history)

| # | commit | compliance | label_rate | lines | status | description |
|---|--------|-----------|-----------|-------|--------|-------------|
| 1 | d209a86 | 91% | 72% | 198 | keep | baseline (T6 broken) |
| 2 | d209a86 | 82% | 88% | 166 | discard | ALWAYS top + reduce rules |
| 3 | d209a86 | 83% | 88% | 201 | discard | ALWAYS top (full 18 rules) |
| 4 | d209a86 | 80% | 77% | 202 | discard | 4th core principle |

## Key Findings

1. **Policy is already near-optimal** (~92% avg compliance, 83% label rate)
2. **T6 "failure" was a test bug** (Korean grep patterns missing)
3. **High non-determinism** (14% compliance swing, 17% label swing) makes reliable optimization impossible at N=3
4. **Moving sections hurts** — ALWAYS-to-top gained labels (+16%) but lost compliance (-8%)
5. **Adding rules dilutes** — 4th core principle made all others weaker
6. **Reducing rules breaks** — cutting from 18 to 10 rules degraded T2/T4
7. **The biggest improvement was Phase 0** — fixing contradictions and single-sourcing

## Recommendations for Future Optimization

- Increase runs to N=5+ per scenario for statistical reliability
- Use Sonnet (not Haiku) to reduce variance
- Focus on label consistency (most variable metric)
- Consider scenario-specific policy sections rather than global rules
