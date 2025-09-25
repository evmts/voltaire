# Ethereum Execution Specs

This directory contains the Ethereum execution specification tests for Guillotine EVM.

## Test Results

Current status: **2124 pass / 1043 fail** (3167 expect() calls total)

## Running the Specs

### Quick Start

```bash
# Run all specs (default: first 100 files)
zig build specs

# Run with more files
zig build specs -- -Dspec-max-files=500

# Run all available spec files
zig build specs -- -Dspec-max-files=10000

# Run specs matching a specific pattern
zig build specs -- -Dspec-pattern='add*.json'

# Run in isolated mode (each test in separate process)
zig build specs -- -Dspec-isolated=true
```

### Build Options

- `-Dspec-max-files=N` - Limit the number of spec files to run (default: 100)
- `-Dspec-pattern='*.json'` - Pattern to match test files (default: '*.json')
- `-Dspec-isolated=true` - Run each test in an isolated process (safer but slower)
- `-Dspec-args` - Additional arguments to pass to the test runner

### Test Modes

1. **Normal Mode** (`ethereum-specs.test.ts`) - Default mode, runs tests in the same process
2. **Isolated Mode** (`ethereum-specs-safe.test.ts`) - Each test runs in a separate worker process to prevent crashes from affecting other tests

### Directory Structure

```
specs/
├── README.md                     # This file
├── CLAUDE.md                     # AI assistant instructions
├── test_report.md                # Detailed test results
├── execution-specs/              # Git submodule with official Ethereum tests
│   └── tests/                    # Test JSON files organized by category
└── bun-runner/                   # Bun test runner implementation
    ├── ethereum-specs.test.ts    # Main test runner
    ├── ethereum-specs-safe.test.ts # Isolated test runner
    ├── test-worker.js            # Worker script for isolated mode
    ├── generate-specs.ts         # (unused) Test generator
    └── package.json              # Bun dependencies
```

## Implementation Details

The test runner:
1. Recursively finds all JSON test files in `execution-specs/tests/`
2. Groups tests by category (directory name)
3. For each test case:
   - Sets up the blockchain environment (block info)
   - Initializes pre-state (accounts, balances, code)
   - Executes transaction(s)
   - Validates the result didn't crash
   - (Post-state validation not yet implemented)

## Known Limitations

- Assembly code tests are skipped (not supported)
- Post-state validation not yet implemented
- Some edge cases may cause crashes in normal mode (use isolated mode for safety)