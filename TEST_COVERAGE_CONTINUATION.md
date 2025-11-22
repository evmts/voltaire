# Test Coverage Enhancement - Continuation Plan

## Current Status (Completed)

### Phase 1: Critical Gaps ✅ COMPLETE (809 tests)
- AccessList (90 tests) - EIP-2930 transaction support
- Authorization (164 tests) - EIP-7702 authorization support
- Blob (97 tests) - EIP-4844 blob transaction support
- HDWallet (119 tests) - BIP32/BIP44 wallet derivation
- KZG (155 tests) - EIP-4844 KZG commitments
- EIP712 (96 tests) - Typed data signing
- Signature (110 tests) - All signature operations
- Bip39 (138 tests) - Mnemonic generation/validation

### Phase 2: High-Value Functionality ✅ COMPLETE (851 tests)
- Bytecode (117 tests) - Contract analysis, disassembly
- RLP (148 new tests) - Type-specific encoding, JSON conversion
- GasConstants (170 tests) - Transaction gas, SSTORE, precompiles
- FeeMarket (108 tests) - EIP-1559/4844 fee calculations
- Opcode (203 tests) - Complete EVM opcode coverage
- Siwe (64 tests) - EIP-4361 authentication
- AesGcm (65 tests) - AES-GCM encryption
- Crypto gaps (36 tests) - Secp256k1/P256 remaining functions

**Total Added: 1,660 comprehensive tests**
**All tests passing: ✅**

---

## Phase 3: Numeric Types (NEXT - Estimated 240 tests)

### Overview
All Int and Uint types need comprehensive operation testing. TypeScript has partial coverage, but missing ~18 method categories for Uint and all operations for Int types.

### Priority: HIGH
These are core numeric primitives used throughout the codebase for EVM arithmetic, gas calculations, and value handling.

### Modules to Test

#### 1. Int8, Int16, Int32, Int64, Int128, Int256
**Location:** `src/primitives/Int{8,16,32,64,128,256}/`
**Current Status:** All operations untested
**Required Tests:** ~40 per type × 6 types = 240 tests

**Test Categories per type:**

**Arithmetic Operations (10 tests):**
- `plus()`, `minus()`, `times()`, `dividedBy()`, `modulo()`
- `abs()`, `negate()`, `toPower()`
- Edge cases: MIN_VALUE, MAX_VALUE, -1, 0, overflow, underflow, divide by zero

**Bitwise Operations (8 tests):**
- `bitwiseAnd()`, `bitwiseOr()`, `bitwiseXor()`, `bitwiseNot()`
- `shiftLeft()`, `shiftRight()` (arithmetic shift for signed)
- Edge cases: shift by 0, shift by width, shift by >width

**Comparison Operations (6 tests):**
- `equals()`, `greaterThan()`, `lessThan()`
- `greaterThanOrEqual()`, `lessThanOrEqual()`, `notEquals()`
- Edge cases: MIN vs MAX, 0 comparisons, negative vs positive

**Conversion Operations (10 tests):**
- `fromBigInt()`, `fromBytes()`, `fromHex()`, `fromNumber()`, `fromString()`
- `toBigInt()`, `toBytes()`, `toHex()`, `toNumber()`, `toString()`
- Edge cases: precision loss (Number ↔ BigInt), overflow, underflow
- Endianness (big-endian, little-endian)

**Utilities (6 tests):**
- `isZero()`, `isNegative()`, `isPositive()`, `sign()`
- `bitLength()`, `leadingZeros()`, `popCount()`
- Edge cases: -1 bit representation, MIN_VALUE sign

**Suggested Approach:**
1. Start with Int256 (most complex, 64 tests)
2. Use Int256 tests as template for smaller types
3. Adjust edge cases for each size (e.g., Int8: -128 to 127)
4. Focus on signed arithmetic overflow/underflow behaviors
5. Test two's complement representation edge cases

**Command to run tests:**
```bash
bun run test -- Int256
bun run test -- Int128
# ... etc
```

#### 2. Uint8, Uint16, Uint32, Uint64, Uint128 (gaps)
**Location:** `src/primitives/Uint{8,16,32,64,128}/`
**Current Status:** Partially tested (basic operations covered)
**Required Tests:** ~20 per type × 5 types = 100 tests (if gaps exist)

**Known Gaps:**
- All operations need same coverage as Uint256 (which was completed in earlier phases)
- Verify if these smaller types have same function set
- If they're just aliases/wrappers, document that

**Verification Needed:**
```bash
# Check if these modules exist and have implementation
ls src/primitives/Uint8/
ls src/primitives/Uint16/
ls src/primitives/Uint32/
ls src/primitives/Uint64/
ls src/primitives/Uint128/
```

---

## Phase 4: JSON-RPC & Utilities (Estimated 200 tests)

### Overview
JSON-RPC implementation has ZERO tests. This is critical for RPC server correctness.

### Priority: CRITICAL for RPC server deployments

### 1. JSON-RPC Core (20 tests)
**Location:** `src/jsonrpc/`

**Test Files Needed:**
- `JsonRpcRequest.test.ts` - Request validation, ID handling
- `JsonRpcError.test.ts` - Error codes, messages, data
- `JsonRpcId.test.ts` - ID validation (string, number, null)
- `JsonRpcVersion.test.ts` - Version "2.0" validation
- `BatchRequest.test.ts` - Batch request handling
- `BatchResponse.test.ts` - Batch response handling

### 2. eth Namespace (50 tests)
**Location:** `src/jsonrpc/eth/`
**Priority:** CRITICAL

**Required Tests:**
- eth_blockNumber, eth_chainId, eth_accounts
- eth_getBalance, eth_getCode, eth_getTransactionCount
- eth_call, eth_estimateGas, eth_sendTransaction, eth_sendRawTransaction
- eth_getBlockByNumber, eth_getBlockByHash
- eth_getTransactionByHash, eth_getTransactionReceipt
- eth_getLogs, eth_getStorageAt
- eth_sign, eth_signTransaction
- Request validation, parameter validation, error handling

### 3. anvil Namespace (40 tests)
**Location:** `src/jsonrpc/anvil/`

**Methods to test:**
- anvil_mine, anvil_setBalance, anvil_setCode, anvil_setNonce
- anvil_impersonateAccount, anvil_stopImpersonatingAccount
- anvil_setBlockTimestampInterval, anvil_removeBlockTimestampInterval
- anvil_snapshot, anvil_revert
- State manipulation validation, error handling

### 4. hardhat Namespace (30 tests)
**Location:** `src/jsonrpc/hardhat/`

**Methods to test:**
- hardhat_mine, hardhat_setBalance, hardhat_setCode, hardhat_setNonce
- hardhat_impersonateAccount, hardhat_stopImpersonatingAccount
- hardhat_reset, hardhat_setLoggingEnabled
- Console log capture, network manipulation

### 5. Utilities (60 tests)

**BloomFilter** (30 tests)
**Location:** `src/primitives/BloomFilter/`

Test categories:
- `create()`, `add()`, `contains()` - basic operations
- `combine()`, `merge()` - filter combination
- `hash()` - bloom hash function
- `isEmpty()`, `density()` - statistics
- `expectedFalsePositiveRate()` - FPR calculation
- `fromHex()`, `toHex()` - serialization
- Edge cases: empty filter, full filter, false positives

**BinaryTree** (30 tests)
**Location:** `src/primitives/BinaryTree/`

Test categories:
- `init()`, `insert()`, `get()` - tree operations
- `hashNode()`, `hashLeaf()`, `hashStem()`, `hashInternal()` - hashing
- `rootHash()`, `rootHashHex()` - root calculation
- `addressToKey()`, `splitKey()`, `getStemBit()` - key operations
- Edge cases: empty tree, single node, collision handling

---

## Phase 5: Polish & Integration (Estimated 300 tests)

### 1. Transaction Edge Cases (30 tests)
**Location:** `src/primitives/Transaction/`

**Missing coverage:**
- Transactions with max values (max nonce, max gas, max value)
- EIP-155 v calculation edge cases
- Contract creation vs regular transaction edge cases
- Zero gas price transactions
- Transaction size limits
- Signature malleability (high-s values)
- Access list edge cases (empty, max entries, duplicate addresses)
- Invalid chain IDs

### 2. State Primitives (50 tests)
**Location:** `src/primitives/State*/`

**Modules needing tests:**
- StateDiff (4 functions untested)
- StorageDiff (4 functions untested)
- StateProof (2 functions untested)
- StorageProof (2 functions untested)

### 3. Remaining Primitives (120 tests)

**TypedData + Domain** (50 tests)
- Complete EIP-712 type system testing
- Domain separator variations
- Nested struct edge cases

**Base64** (20 tests)
- Complete encode/decode coverage
- Error path testing
- Edge cases (whitespace, mixed charsets)

**Ens** (20 tests)
- Name normalization (ENSIP-15)
- Namehash calculation
- Labelhash
- Unicode handling

**StealthAddress** (25 tests)
- Meta-address generation
- Stealth address generation
- View tag computation
- Key compression

**Permit** (15 tests)
- EIP-2612 permit signatures
- Permit verification
- Expiration handling

### 4. Examples Validation (50 tests)

**Test that all examples work:**
- `examples/addresses/*.ts` - Address examples
- `examples/getting-started/*.ts` - Quickstart examples
- `examples/hashing/*.ts` - Hash examples
- `examples/hex-and-bytes/*.ts` - Conversion examples
- `examples/rlp/*.ts` - RLP examples
- `examples/signing/*.ts` - Signature examples
- `examples/typescript/*.ts` - TypeScript usage examples

Create `*.test.ts` for each example verifying it runs without errors.

### 5. Integration Tests (50 tests)

**Missing integration scenarios:**
- Transaction lifecycle: Build → Sign → Serialize → Verify
- State proof workflow: Generate → Verify → Extract
- EIP-4844 full workflow: Data → Blob → Commitment → Proof → Transaction
- HD wallet workflow: Mnemonic → Seed → Keys → Addresses
- Contract deployment: Bytecode → Deploy → Calculate address
- Access list optimization: Analyze → Generate → Validate gas savings
- Multi-signature workflow: Multiple signers → Aggregate → Verify
- Cross-chain scenarios: Different chain IDs → Replay protection
- Fee market simulation: Base fee updates over blocks
- Precompile chains: ecRecover → Address derivation

---

## Implementation Strategy

### Day 1: Phase 3 - Numeric Types
1. **Morning:** Implement Int256 comprehensive tests (40 tests)
   - Template for other Int types
2. **Afternoon:** Implement Int128, Int64, Int32, Int16, Int8 (200 tests)
   - Reuse Int256 template, adjust edge cases

### Day 2: Phase 4 Part 1 - JSON-RPC Core & eth
1. **Morning:** JSON-RPC core modules (20 tests)
2. **Afternoon:** eth namespace critical methods (50 tests)

### Day 3: Phase 4 Part 2 - Utilities
1. **Morning:** BloomFilter (30 tests)
2. **Afternoon:** BinaryTree (30 tests)
3. **Evening:** anvil/hardhat namespaces (70 tests)

### Day 4: Phase 5 - Polish & Integration
1. **Morning:** Transaction edge cases + State primitives (80 tests)
2. **Afternoon:** Remaining primitives (TypedData, Domain, Base64, etc.) (120 tests)
3. **Evening:** Examples validation + Integration tests (100 tests)

---

## Testing Best Practices

### File Organization
```typescript
// src/primitives/Int256/Int256.test.ts
import { describe, test, expect } from 'vitest'
import * as Int256 from './index.js'

describe('Int256', () => {
  describe('Arithmetic Operations', () => {
    test('plus adds two positive numbers', () => {
      const a = Int256.from(100n)
      const b = Int256.from(200n)
      expect(Int256.plus(a, b)).toEqual(Int256.from(300n))
    })

    test('plus with MAX_VALUE overflows', () => {
      const max = Int256.MAX_VALUE
      const one = Int256.from(1n)
      expect(() => Int256.plus(max, one)).toThrow()
    })
  })
})
```

### Test Structure
1. **Group by function** - One `describe` block per function
2. **Test happy path first** - Valid inputs, expected outputs
3. **Test boundary conditions** - 0, 1, MAX, MIN, -1
4. **Test error conditions** - Invalid inputs, overflow, underflow
5. **Test edge cases** - Algorithm-specific corner cases

### Running Tests
```bash
# Run all tests
bun run test:run

# Run specific module
bun run test -- Int256

# Run with coverage
bun run test:coverage

# Watch mode
bun run test
```

### Debugging Failed Tests
```bash
# Run single test file
bun run vitest run src/primitives/Int256/Int256.test.ts

# Verbose output
bun run vitest run --reporter=verbose

# Check specific assertion
bun run vitest run --grep "plus with MAX_VALUE"
```

---

## Success Criteria

### Phase 3 Complete When:
- [ ] All 6 Int types have 40+ tests each (240 total)
- [ ] All tests passing
- [ ] Coverage reports show >95% for Int modules
- [ ] Edge cases documented in test names

### Phase 4 Complete When:
- [ ] JSON-RPC core has 20 tests
- [ ] eth namespace has 50 tests for critical methods
- [ ] anvil/hardhat namespaces have 70 tests
- [ ] BloomFilter has 30 tests
- [ ] BinaryTree has 30 tests
- [ ] All tests passing

### Phase 5 Complete When:
- [ ] Transaction edge cases covered (30 tests)
- [ ] State primitives tested (50 tests)
- [ ] Remaining primitives covered (120 tests)
- [ ] All examples have validation tests (50 tests)
- [ ] Integration tests complete (50 tests)
- [ ] All tests passing
- [ ] Coverage report shows >90% overall

---

## Known Issues to Avoid

### 1. Pre-existing Test Failures
Current test suite shows:
- 130 test files failing (pre-existing)
- 387 individual tests failing (pre-existing)

**These are NOT your responsibility.** Focus only on:
- New tests you create should pass
- Don't break existing passing tests
- Document if you discover root causes

### 2. Import Paths
Always use `.js` extensions in imports:
```typescript
// ✅ Correct
import * as Int256 from './index.js'
import { from } from './from.js'

// ❌ Wrong (will fail)
import * as Int256 from './index'
import { from } from './from'
```

### 3. Branded Types
Many types are branded Uint8Arrays:
```typescript
type Int256Type = bigint & { readonly __tag: 'Int256' }

// Use constructor
const value = Int256.from(100n)

// Don't compare directly
expect(value).toEqual(Int256.from(100n)) // ✅
expect(value).toBe(100n) // ❌
```

### 4. Async Operations
Some crypto operations are async:
```typescript
// ✅ Correct
test('async operation', async () => {
  const result = await crypto.subtle.digest(...)
  expect(result).toBeDefined()
})

// ❌ Wrong (test will pass before completion)
test('async operation', () => {
  crypto.subtle.digest(...).then(result => {
    expect(result).toBeDefined()
  })
})
```

---

## Quick Start Commands

```bash
# Navigate to project
cd /Users/williamcory/voltaire

# Check current test status
bun run test:run 2>&1 | grep "Test Files"

# Start Phase 3 - Create Int256 tests
code src/primitives/Int256/Int256.test.ts

# Run tests as you write them
bun run test -- Int256

# When done with Int types, check coverage
bun run test:coverage -- "src/primitives/Int*"

# Move to Phase 4 - JSON-RPC
code src/jsonrpc/JsonRpcRequest.test.ts

# Run RPC tests
bun run test -- jsonrpc

# Final validation - run all tests
bun run test:run
```

---

## Contact & Questions

If you encounter issues:
1. Check this document's "Known Issues" section
2. Look at existing test patterns in the codebase
3. Search for similar test implementations
4. Document blocking issues for team review

---

## Estimated Timeline

- **Phase 3 (Int types):** 1-2 days (240 tests)
- **Phase 4 (JSON-RPC & Utilities):** 2-3 days (200 tests)
- **Phase 5 (Polish & Integration):** 2-3 days (300 tests)

**Total: 5-8 days to complete remaining 740 tests**

Combined with completed Phases 1-2 (1,660 tests), this will bring total new test coverage to **~2,400 comprehensive tests** ensuring bulletproof coverage for the entire Voltaire codebase.

Good luck! 🚀
