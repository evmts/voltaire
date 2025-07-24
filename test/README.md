# Tests

Integration and end-to-end test suite for the Guillotine EVM implementation.

## Running Tests

```bash
zig build test
```

## Important Note

The preferred approach is to add tests in the same file as the code being tested. Tests in this directory exist for:
- Legacy reasons
- Full end-to-end integration tests
- Tests that would create circular dependencies if placed in source files

## Test Organization

- `data/` - Test data including blockchain blocks
- `evm/` - EVM-specific integration tests
  - `opcodes/` - Comprehensive opcode tests
  - `integration/` - Multi-component integration tests
  - `precompiles/` - Precompiled contract tests
  - `gas/` - Gas accounting tests
  - `state/` - State management tests
- `fuzz/` - Fuzz testing for all major components

## Testing Philosophy

Tests follow a no-abstraction approach for clarity:
- All test setup is inline
- No helper functions or utilities
- Each test is self-contained
- Copy-paste is encouraged for readability