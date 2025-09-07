# Test Utilities

Testing infrastructure and utilities for the Guillotine EVM implementation.

## Overview

This module provides comprehensive testing tools, fixtures, and utilities to ensure correctness of the EVM implementation.

## Components

### Core Testing Utilities
- **test_runner.zig** - Main test runner and orchestration
- **trace_diff.zig** - Differential testing utilities for comparing execution traces
- **test_fixtures.zig** - Common test fixtures and data generators

### Fixtures Directory (`fixtures/`)
Contains pre-generated test cases for various EVM operations:

#### Opcode Testing
- **opcodes-arithmetic/** - Arithmetic operation test cases
- **opcodes-arithmetic-advanced/** - Complex arithmetic scenarios
- **opcodes-bitwise/** - Bitwise operation tests
- **opcodes-comparison/** - Comparison operator tests
- **opcodes-context/** - Context-related opcode tests
- **opcodes-control/** - Control flow operation tests
- **opcodes-crypto/** - Cryptographic operation tests
- **opcodes-data/** - Data manipulation tests
- **opcodes-dup/** - DUP opcode tests
- **opcodes-environmental-1/** - Environmental info tests (part 1)
- **opcodes-environmental-2/** - Environmental info tests (part 2)
- **opcodes-jump-basic/** - Basic jump operation tests
- **opcodes-log/** - LOG opcode tests
- **opcodes-memory/** - Memory operation tests
- **opcodes-push-pop/** - PUSH/POP operation tests
- **opcodes-storage-cold/** - Cold storage access tests
- **opcodes-storage-warm/** - Warm storage access tests
- **opcodes-swap/** - SWAP opcode tests
- **opcodes-system/** - System operation tests
- **opcodes-block-1/** - Block-related opcodes (part 1)
- **opcodes-block-2/** - Block-related opcodes (part 2)

#### Precompile Testing
- **precompile-ecrecover/** - ECRECOVER precompile tests
- **precompile-sha256/** - SHA256 precompile tests
- **precompile-ripemd160/** - RIPEMD160 precompile tests
- **precompile-identity/** - Identity precompile tests
- **precompile-modexp/** - ModExp precompile tests
- **precompile-bn256add/** - BN256Add precompile tests
- **precompile-bn256mul/** - BN256Mul precompile tests
- **precompile-bn256pairing/** - BN256Pairing precompile tests
- **precompile-blake2f/** - Blake2F precompile tests
- **precompile-pointevaluation/** - Point evaluation precompile tests

#### Contract Testing
- **erc20-transfer/** - ERC20 transfer tests
- **erc20-mint/** - ERC20 minting tests
- **erc20-approval-transfer/** - ERC20 approval and transfer tests
- **weth-mainnet/** - WETH contract tests
- **usdc-proxy/** - USDC proxy contract tests

#### DeFi Protocol Testing
- **uniswap-v2-router/** - Uniswap V2 router tests
- **uniswap-v3-pool-eth-usdc/** - Uniswap V3 pool tests
- **aave-v3-pool/** - Aave V3 pool tests
- **compound-cusdc/** - Compound cUSDC tests

#### Performance Testing
- **ten-thousand-hashes/** - Performance test with 10k hash operations
- **snailtracer/** - Complex execution tracing tests

## Usage

Import test utilities:
```zig
const test_utils = @import("_test_utils");
const fixtures = test_utils.fixtures;
```

## Testing Philosophy

- **Differential Testing** - Compare against reference implementations
- **Fixture-Based Testing** - Use pre-generated test cases
- **Property-Based Testing** - Verify invariants and properties
- **Performance Testing** - Ensure execution meets performance targets