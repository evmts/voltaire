# Issue #33 Continuation: TypeScript Test Failures Handoff

## Mission
Continue fixing TypeScript type errors to reduce test failures. Previous session reduced failures from 425→386 (-9%). Target: Get all 18,197 tests passing.

## Current State

```
Test Files  60 failed | 756 passed | 2 skipped (818)
Tests       386 failed | 17629 passed | 182 skipped (18197)
Errors      1546 source errors
```

**Commit baseline**: `18c4950af` on `main`

## What Was Already Fixed

| Issue | Files | Technique |
|-------|-------|-----------|
| WithdrawalType wrong field types | `src/primitives/Withdrawal/WithdrawalType.ts` | Use domain-specific branded types |
| batch.ts undefined errors | `src/utils/batch.ts` | Non-null assertions `batch[i]!` with safety comment |
| Hardware wallet imports | `src/wallet/hardware/*.ts` | Fix imports, `@ts-expect-error` for optional deps |
| Secp256k1.getPublicKey references | 17 files | Global rename to `derivePublicKey` |
| Keccak256Hash declaration conflict | `src/crypto/Keccak256/Keccak256.native.ts` | Rename type import to avoid conflict |
| SHA256 return types | `src/crypto/SHA256/*.js` | JSDoc type casts `/** @type {SHA256Hash} */` |
| UserOperation bigint mutation | `src/primitives/UserOperation/pack.js` | Cast to `/** @type {bigint} */` before `>>=` |
| EIP712 index signature | `src/crypto/EIP712/Domain/hash.js` | Add `@type {Record<string, ...>}` |
| MAX_SAFE_INTEGER typo | `src/evm/log/0xa*.js` | Fix `MAXSAFEINTEGER` → `MAX_SAFE_INTEGER` |
| Bitwise pop() undefined | `src/evm/bitwise/0x1*.js` | JSDoc cast after length check |
| Frame default params | `src/evm/Frame/from.js` | Cast defaults to `AddressType` |
| P256 Hash import | `src/crypto/p256.wasm.ts` | Import `HashType` not `Hash` namespace |

## Remaining Error Patterns (Priority Order)

### 1. HIGH: Implicit `any` parameters (~200+ errors)
```
Parameter 'bytes' implicitly has an 'any' type.
❯ src/primitives/UserOperation/hash.js:28:17
```

**Fix pattern**:
```javascript
// Before
const pad32 = (bytes) => { ... }

// After
/** @param {Uint8Array} bytes */
const pad32 = (bytes) => { ... }
```

**Files to check**:
- `src/primitives/UserOperation/hash.js`
- `src/primitives/Blob/*.js`
- `src/primitives/Rlp/*.js`
- `src/crypto/Bip39/*.js`

### 2. HIGH: Array.pop() possibly undefined (~100+ errors)
```
'value' is possibly 'undefined'.
```

**Fix pattern** (after length check):
```javascript
// Before
const value = stack.pop();

// After
const value = /** @type {bigint} */ (stack.pop());
```

**Directories to sweep**:
- `src/evm/arithmetic/` - All opcode files
- `src/evm/comparison/`
- `src/evm/stack/`
- `src/evm/memory/`

### 3. MEDIUM: Branded type mismatches (~85 errors)
```
Property '[brand]' is missing in type 'Uint8Array'
```

**Fix pattern**:
```javascript
// Before
const address = new Uint8Array(20);

// After
const address = /** @type {import("./AddressType.js").AddressType} */ (
  new Uint8Array(20)
);
```

**Areas**:
- `src/evm/` - Frame construction, call results
- `src/primitives/Transaction/` - Envelope building

### 4. MEDIUM: String | undefined not assignable (~50+ errors)
```
Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
```

**Fix patterns**:
```javascript
// Option 1: Non-null assertion (if guaranteed)
const value = obj.prop!;

// Option 2: Default value
const value = obj.prop ?? "";

// Option 3: Early return
if (!obj.prop) throw new Error("Missing prop");
```

**Files**:
- `src/primitives/TransactionUrl/parse.js`
- `src/crypto/Bip39/*.js`

### 5. LOW: Return type mismatches
```
Type 'Uint8Array' is not assignable to type 'SHA256Hash'.
```

**Fix pattern** (JSDoc return type + cast):
```javascript
/**
 * @returns {import('./SHA256HashType.js').SHA256Hash}
 */
export function hash(data) {
  return /** @type {import('./SHA256HashType.js').SHA256Hash} */ (
    nobleSha256(data)
  );
}
```

## Validation Commands

```bash
# Quick error count
bun run tsc --noEmit 2>&1 | wc -l

# Find specific error patterns
bun run tsc --noEmit 2>&1 | grep "implicitly has an 'any'" | wc -l
bun run tsc --noEmit 2>&1 | grep "possibly 'undefined'" | wc -l
bun run tsc --noEmit 2>&1 | grep "\\[brand\\]" | wc -l

# Run tests (includes typecheck)
bun run test:run 2>&1 | tail -20

# Run specific test file
bun run test:run src/evm/arithmetic/0x01_ADD.test.ts
```

## Efficient Fix Strategy

### Batch Processing
Many EVM opcode files have identical patterns. Fix one, then apply to all:

```bash
# Find all arithmetic opcodes
ls src/evm/arithmetic/

# After fixing 0x01_ADD.js, apply same pattern to:
# 0x02_MUL.js, 0x03_SUB.js, 0x04_DIV.js, etc.
```

### Use replace_all
For systematic fixes across a file:
```
Edit with replace_all: true
old_string: "frame.stack.pop()"
new_string: "/** @type {bigint} */ (frame.stack.pop())"
```

### Parallel Subagents
Spawn multiple agents for independent file groups:
- Agent 1: `src/evm/arithmetic/` (all opcode files)
- Agent 2: `src/evm/comparison/`
- Agent 3: `src/primitives/Blob/`
- Agent 4: `src/crypto/Bip39/`

## Architecture Context

### Branded Types Pattern
All primitives use branded Uint8Array for type safety:
```typescript
type AddressType = Uint8Array & { readonly [brand]: "Address" };
```

### JSDoc for .js Files
Implementation files use `.js` with JSDoc types:
```javascript
/** @param {AddressType} address */
export function toHex(address) { ... }
```

### Namespace Pattern
Each primitive exports as namespace:
```typescript
import * as Address from './primitives/Address/index.js';
Address.toHex(addr);
```

## Do NOT
- Use `any` casts unless absolutely necessary
- Remove or disable tests
- Change public API signatures
- Skip validation after fixes

## Success Criteria
- All 18,197 tests passing
- Zero source errors in `bun run test:run`
- `zig build test` still passes (no regressions)

## Files Structure for Reference
```
src/
├── primitives/          # Ethereum types
│   ├── Address/
│   ├── Transaction/
│   ├── Blob/
│   └── UserOperation/
├── crypto/              # Cryptographic functions
│   ├── Keccak256/
│   ├── SHA256/
│   ├── Bip39/
│   └── EIP712/
├── evm/                 # EVM implementation
│   ├── arithmetic/      # ADD, MUL, SUB, etc.
│   ├── bitwise/         # AND, OR, XOR, etc.
│   ├── comparison/      # LT, GT, EQ, etc.
│   ├── stack/           # PUSH, POP, DUP, etc.
│   ├── memory/          # MLOAD, MSTORE, etc.
│   ├── log/             # LOG0-4
│   └── Frame/           # Execution frame
└── utils/               # Utilities
```

## Recommended First Actions

1. **Count errors by category**:
   ```bash
   bun run tsc --noEmit 2>&1 | grep "error TS" | sed 's/.*error /error /' | sort | uniq -c | sort -rn | head -20
   ```

2. **Pick highest-impact directory** (likely `src/evm/arithmetic/`)

3. **Fix one file completely**, validate, then replicate pattern

4. **Commit frequently** with descriptive messages

---
_Handoff prepared by Claude Code - Issue #33 continuation_
