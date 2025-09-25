# CLAUDE.md - Ethereum Specs Testing Guide

## Overview

The specs directory contains Ethereum execution specification tests to validate Guillotine EVM against the official test suite.

## Running Specs

### Basic Commands

```bash
# Quick test (100 files)
zig build specs

# Full test suite
zig build specs -- -Dspec-max-files=10000

# Isolated mode (safer, prevents crashes from affecting other tests)
zig build specs -- -Dspec-isolated=true

# Filter tests by pattern
zig build specs -- -Dspec-pattern='add*.json'
```

## Current Status

- **2124 tests passing**
- **1043 tests failing**
- **3167 total expect() calls**

## Working with Specs

### When Debugging Failures

1. Use isolated mode to prevent crashes:
   ```bash
   zig build specs -- -Dspec-isolated=true -Dspec-pattern='failing_test*.json'
   ```

2. Check `specs/test_report.md` for detailed failure information

3. Test files are in `specs/execution-specs/tests/` organized by category

### Key Files

- `specs/bun-runner/ethereum-specs.test.ts` - Main test runner (fast, in-process)
- `specs/bun-runner/ethereum-specs-safe.test.ts` - Isolated test runner (safer, uses workers)
- `specs/bun-runner/test-worker.js` - Worker script for isolated execution

### Implementation Notes

The test runner:
1. Loads JSON test files from `execution-specs/tests/`
2. Sets up EVM with specified pre-state
3. Executes transactions
4. Currently validates execution doesn't crash (post-state validation TODO)

### Known Issues

- Assembly code tests are skipped (`:asm` format not supported)
- Post-state validation not implemented yet
- Some tests may crash the runner (use isolated mode)

## Best Practices

1. **Always run specs after EVM changes** to catch regressions
2. **Use isolated mode** when debugging crashes
3. **Start with small batches** when investigating failures:
   ```bash
   zig build specs -- -Dspec-max-files=10 -Dspec-pattern='specific*.json'
   ```
4. **Check test categories** - failures often cluster by feature area

## Improving Test Coverage

Priority areas for improvement:
1. Implement post-state validation
2. Add support for assembly code tests
3. Improve error reporting for failures
4. Add differential testing against revm