# Voltaire-Effect Review Summary

**Updated**: 2026-01-26

## Status

Most critical items complete. Remaining work tracked in issues/.

## Active Issues

| Issue | Priority | Status |
|-------|----------|--------|
| issues/001-l2-formatters.md | P1 | Not Started |
| issues/002-toAccount-factory.md | P2 | Not Started |
| issues/003-erc6492-signatures.md | P2 | Not Started |
| issues/004-vitest-migration-cleanup.md | P3 | 90% Complete |

## Remaining P1

- 38 WebSocket integration tests skipped
- 13 BatchScheduler integration tests skipped
- KZG Effect.sync pattern (should use Effect.try)
- L2 formatters (depositNonce, gasUsedForL1, etc.)

## Remaining P2

- 168+ unsafe `as SomeError` casting
- toAccount factory
- ERC-6492 signatures

## Remaining P3

- 16 test files still use raw vitest
- Anvil/Hardhat integration tests
- HMAC weak key validation
