# Solidity Test Contracts

Solidity contracts compiled using the `src/compilers` package for benchmarking and integration testing.

## Contracts

### Test Contracts
- `TestContracts.sol` - Basic test contracts for common operations
- `DataStructureContracts.sol` - Testing arrays, mappings, and complex data structures
- `ErrorHandlingContracts.sol` - Testing revert, require, and error handling
- `InheritanceContracts.sol` - Testing inheritance and interface patterns
- `AdvancedTestContracts.sol` - Advanced contract interactions and patterns

### Benchmark Contracts
- `SnailShellBenchmark.sol` - Compute-intensive benchmark with nested loops
- `TenThousandHashesBenchmark.sol` - Storage and hashing benchmark

### Test Files
- `snail_shell_benchmark_test.zig` - Zig test for SnailShellBenchmark
- `ten_thousand_hashes_benchmark_test.zig` - Zig test for TenThousandHashesBenchmark

## Usage

These contracts are automatically compiled by the build system and used in:
- Integration tests in `/test/evm/`
- Benchmark suite in `/bench/`

## Output

Compiled artifacts are stored in `zig-out/lib/`.