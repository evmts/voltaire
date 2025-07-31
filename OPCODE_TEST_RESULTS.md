# EVM Opcode Test Results - Zig vs REVM Comparison

This table shows the test results comparing our Zig EVM implementation against REVM (the reference Rust implementation).

**Summary**: 26/61 tests pass, 35 tests fail

## Test Results Table

| Opcode | Test Case | Result Correct? | Gas Correct? | Status | Notes |
|--------|-----------|-----------------|--------------|--------|-------|
| **Arithmetic Operations** |
| ADD | 5 + 10 = 15 | ✅ Yes | ❌ No | FAIL | Gas: Expected 21024, Got 124 |
| ADD | MAX + 1 = 0 (overflow) | ✅ Yes | ✅ Yes | PASS | Overflow behavior correct |
| SUB | 100 - 58 = 42 | ❌ No | - | FAIL | Result: Expected -42 (two's complement), Got 42. **Stack order issue: REVM does top - second** |
| SUB | 5 - 10 (underflow) | ❌ No | - | FAIL | Result: Expected 5, Got -5 (two's complement). **Stack order issue** |
| MUL | 7 * 6 = 42 | ✅ Yes | ❌ No | FAIL | Gas: Expected 21026, Got 126 |
| DIV | 84 / 2 = 42 | ❌ No | - | FAIL | Result: Expected 0, Got 42. **Stack order issue: REVM does top / second** |
| DIV | 10 / 0 = 0 | ✅ Yes | ❌ No | FAIL | Gas: Expected 21026, Got 126 |
| MOD | 17 % 5 = 2 | ❌ No | - | FAIL | Result: Expected 5, Got 2. **Stack order issue: REVM does top % second** |
| SDIV | -10 / 3 = -3 | ❌ No | - | FAIL | Result: Expected 0, Got -3. **Stack order issue** |
| SMOD | -10 % 3 = -1 | ❌ No | - | FAIL | Result: Expected 3, Got -1. **Stack order issue** |
| ADDMOD | (10 + 10) % 8 = 4 | ❌ No | - | FAIL | Result: Expected 8, Got 4. **Stack order issue** |
| MULMOD | (10 * 10) % 8 = 4 | ❌ No | - | FAIL | Result: Expected 0, Got 4. **Stack order issue** |
| EXP | 2 ** 3 = 8 | ❌ No | - | FAIL | Result: Expected 9, Got 8. **Stack order issue: REVM does top ** second** |
| SIGNEXTEND | 0xFF from byte 0 | ✅ Yes | ❌ No | FAIL | Gas: Expected 21026, Got 126 |
| **Comparison Operations** |
| LT | 5 < 10 = 1 | ✅ Yes | ❌ No | FAIL | Gas: Expected 21024, Got 124 |
| GT | 10 > 5 = 1 | ✅ Yes | ❌ No | FAIL | Gas: Expected 21024, Got 124 |
| SLT | -1 < 1 = 1 | ✅ Yes | ❌ No | FAIL | Gas: Expected 21024, Got 124 |
| SGT | 1 > -1 = 1 | ✅ Yes | ❌ No | FAIL | Gas: Expected 21024, Got 124 |
| EQ | 42 == 42 = 1 | ✅ Yes | ❌ No | FAIL | Gas: Expected 21024, Got 124 |
| ISZERO | 0 = 1 | ✅ Yes | ❌ No | FAIL | Gas: Expected 21023, Got 121 |
| **Bitwise Operations** |
| AND | 0xFF & 0x0F = 0x0F | ✅ Yes | ❌ No | FAIL | Gas: Expected 21024, Got 124 |
| OR | 0xF0 \| 0x0F = 0xFF | ✅ Yes | ❌ No | FAIL | Gas: Expected 21024, Got 124 |
| XOR | 0xFF ^ 0xF0 = 0x0F | ✅ Yes | ❌ No | FAIL | Gas: Expected 21024, Got 124 |
| NOT | ~0 = MAX | ✅ Yes | ❌ No | FAIL | Gas: Expected 21023, Got 121 |
| BYTE | Extract byte at index | ✅ Yes | ✅ Yes | PASS | Correct implementation |
| SHL | 1 << 4 = 16 | ✅ Yes | ❌ No | FAIL | Gas: Expected 21024, Got 124 |
| SHR | 16 >> 4 = 1 | ✅ Yes | ❌ No | FAIL | Gas: Expected 21024, Got 124 |
| SAR | -16 >> 4 = -1 | ✅ Yes | ❌ No | FAIL | Gas: Expected 21024, Got 124 |
| **Stack Operations** |
| POP | Remove top stack item | ✅ Yes | ❌ No | FAIL | Gas: Expected 21020, Got 123 |
| PUSH1 | Push 1 byte | ✅ Yes | ❌ No | FAIL | Gas: Expected 21021, Got 118 |
| PUSH2 | Push 2 bytes | ✅ Yes | ❌ No | FAIL | Gas: Expected 21021, Got 118 |
| PUSH32 | Push 32 bytes | ✅ Yes | ❌ No | FAIL | Gas: Expected 21021, Got 118 |
| DUP1 | Duplicate top | ✅ Yes | ✅ Yes | PASS | Correct implementation |
| SWAP1 | Swap top two | ✅ Yes | ✅ Yes | PASS | Correct implementation |
| **Memory Operations** |
| MLOAD | Load from memory | ✅ Yes | ✅ Yes | PASS | Correct implementation |
| MSTORE | Store to memory | ✅ Yes | ✅ Yes | PASS | Correct implementation |
| MSTORE8 | Store single byte | ✅ Yes | ✅ Yes | PASS | Correct implementation |
| MSIZE | Memory size | ✅ Yes | ✅ Yes | PASS | Correct implementation |
| **Storage Operations** |
| SLOAD | Load from storage | ✅ Yes | ✅ Yes | PASS | Correct implementation |
| SSTORE | Store to storage | - | - | PASS | Reverts as expected in call context |
| **Control Flow** |
| PC | Program counter | ✅ Yes | ✅ Yes | PASS | Correct implementation |
| JUMP | Jump to destination | - | - | SKIP | Invalid jump in test |
| JUMPI | Conditional jump | - | - | SKIP | Invalid jump in test |
| GAS | Remaining gas | ❌ No | - | FAIL | Different gas values: Expected 978998, Got 999898 |
| **System Operations** |
| RETURN | Return data | ✅ Yes | ✅ Yes | PASS | Correct implementation |
| REVERT | Revert execution | - | - | SKIP | Test expects revert |
| LOG0 | Emit log | ✅ Yes | ✅ Yes | PASS | Correct implementation |
| **Environment Operations** |
| ADDRESS | Contract address | ❌ No | - | FAIL | Different addresses in test setup |
| CALLER | Caller address | ❌ No | - | FAIL | Different caller addresses in test setup |
| CALLVALUE | Call value | ✅ Yes | ✅ Yes | PASS | Correct implementation |
| CALLDATASIZE | Calldata size | ✅ Yes | ✅ Yes | PASS | Correct implementation |
| CODESIZE | Code size | ✅ Yes | ✅ Yes | PASS | Correct implementation |
| CODECOPY | Copy code | ✅ Yes | ✅ Yes | PASS | Correct implementation |
| GASPRICE | Gas price | ✅ Yes | ✅ Yes | PASS | Correct implementation |
| **Block Operations** |
| BLOCKHASH | Block hash | ✅ Yes | ✅ Yes | PASS | Correct implementation |
| COINBASE | Coinbase address | ✅ Yes | ✅ Yes | PASS | Correct implementation |
| TIMESTAMP | Block timestamp | ❌ No | - | FAIL | Expected 1, Got 0. **Default value difference** |
| NUMBER | Block number | ✅ Yes | ✅ Yes | PASS | Correct implementation |
| DIFFICULTY | Block difficulty | ✅ Yes | ✅ Yes | PASS | Correct implementation |
| GASLIMIT | Gas limit | ❌ No | - | FAIL | Expected MAX_U256, Got 0. **Default value difference** |
| CHAINID | Chain ID | ✅ Yes | ✅ Yes | PASS | Correct implementation |
| SELFBALANCE | Contract balance | ✅ Yes | ✅ Yes | PASS | Correct implementation |
| BASEFEE | Base fee | ✅ Yes | ✅ Yes | PASS | Correct implementation |
| **Cryptographic Operations** |
| KECCAK256 | Hash empty data | ? | ? | ERROR | Test execution error |

## Key Issues Identified

### 1. **Critical: Stack Order for Binary Operations**
REVM uses **opposite stack order** for binary operations compared to our implementation:
- REVM: `result = top OP second` (e.g., `top - second`)
- Ours: `result = second OP top` (e.g., `second - top`)

Affected opcodes: SUB, DIV, MOD, SDIV, SMOD, ADDMOD, MULMOD, EXP

### 2. **Gas Accounting Differences**
Almost all operations show different gas usage:
- REVM counts total gas used including contract call overhead (~21000)
- Our implementation counts only opcode gas (~100-200)

### 3. **Environment Setup Differences**
- ADDRESS/CALLER: Different test addresses
- TIMESTAMP: REVM defaults to 1, we default to 0
- GASLIMIT: REVM defaults to MAX_U256, we default to 0
- GAS: Different remaining gas calculations

### 4. **Passing Operations**
These opcodes work correctly:
- Memory operations (MLOAD, MSTORE, MSTORE8, MSIZE)
- Storage operations (SLOAD, SSTORE)
- Stack operations functionality (DUP1, SWAP1)
- Most environment queries
- Block information queries
- Control flow (PC, RETURN, LOG0)

## Recommendations

1. **Fix stack order for binary operations** - This is the most critical issue
2. **Align gas accounting** with REVM's method
3. **Match default environment values** for testing
4. **Fix KECCAK256 test** execution error