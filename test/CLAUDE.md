# Integration Tests

This directory contains integration tests that verify cross-module behavior, differential testing against reference implementations, and full EVM execution tests.

## Test Organization

All integration tests are aggregated in `test/root.zig` and can be run with:
```bash
zig build test-integration
```

## Test Categories

### Differential Tests (`test/differential/`)
Tests that compare Guillotine's behavior against reference implementations:
- Math operations
- Stack operations
- Memory operations
- Storage operations
- Jump handlers
- Context operations
- Environmental operations
- Precompiles
- Contract execution

### EVM Tests (`test/evm/`)
Full EVM execution tests:
- ERC20 deployment and operations
- Snailtracer benchmark
- Transfer tests
- Access list tests
- Self-destruct behavior

### Opcode Tests (`test/evm/opcodes/`)
Per-opcode differential tests comparing against MinimalEvm:
- All opcodes tested individually
- Run with: `zig build test-opcodes`
- Filter specific opcodes: `zig build test-opcodes -Dtest-filter='ADD'`

### Official Tests (`test/official/`)
Ethereum execution spec compliance tests:
- State tests
- Blockchain tests

## Writing Integration Tests

Integration tests should:
1. Test behavior across multiple modules
2. Use realistic scenarios and fixtures
3. Compare against expected outputs or reference implementations
4. Be self-contained with clear setup and assertions

## Test Filtering

Filter tests by pattern:
```bash
zig build test-integration -Dtest-filter='erc20'
zig build test-integration -Dtest-filter='differential'
```

## Known Issues

Some tests are commented out due to:
- `bitwise_extended_test.zig` - Causes crash
- `gas_edge_cases_test.zig` - Causes infinite loop
- Various comprehensive tests - Too slow for regular CI

These need investigation and fixing.