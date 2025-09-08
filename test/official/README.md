# Official Execution Spec Fixtures

This folder wires the Ethereum execution-spec-tests (v4.5.0) into Guillotine.

Contents:
- `fixtures/` — extracted from `fixtures_stable.tar.gz` published at v4.5.0
- `state_smoke_test.zig` — a minimal, self-contained state-test runner

Usage:
- Download fixtures (already done here in development):
  - `curl -L -o test/official/fixtures_stable.tar.gz https://github.com/ethereum/execution-spec-tests/releases/download/v4.5.0/fixtures_stable.tar.gz`
  - `tar -xzf test/official/fixtures_stable.tar.gz -C test/official`
- Run the smoke test (non-strict — executes but does not enforce full post-state):
  - `zig build test-official`
- Run the smoke test in strict mode (enforces post-state; may fail until parity improves):
  - `zig build test-official-strict`

Notes:
- This harness focuses on `state_tests` and is intentionally lightweight.
- It currently targets a single representative JSON to keep CI time reasonable and the integration simple.
- Extend by duplicating the `test` block in `state_smoke_test.zig` with additional JSON paths, or by iterating a small curated set.

