# Complete Namespace+Type Overloading Pattern Implementation

## Context

The namespace+type overloading pattern has been **successfully implemented** for:
- ✅ **Hash** (`src/primitives/Hash/Hash.ts`)
- ✅ **Hex** (`src/primitives/Hex/Hex.ts`)
- ✅ **Uint** (`src/primitives/Uint/Uint.ts`)

These serve as reference implementations. The pattern is documented in `REFACTOR_PATTERN.md`.

## Remaining Work

### 1. Apply Pattern to Remaining Primitives

**Primitives needing the pattern:**
- `Address` - Special case: currently uses old Class pattern, needs complete refactor
- `Rlp`
- `Blob`
- `Siwe`
- `State`
- `Transaction`
- `EventLog`
- `FeeMarket`
- `Bytecode`
- `AccessList`
- `Opcode`
- `GasConstants`
- `Authorization`
- `Hardfork`

**For each primitive:**

1. Open `src/primitives/{Primitive}/{Primitive}.ts`
2. Identify methods with `this:` parameter vs static/construction methods
3. Apply the 3-section pattern:
   - Section 1: Export static methods as-is, export `this:` methods with `_` prefix
   - Section 2: Import internal `this:` methods for wrapper usage
   - Section 3: Add public wrapper functions that call `from(value)` then `.call()` internal method
4. Ensure `from()` accepts a union type of common inputs (e.g., `string | Uint8Array` for Hash/Hex, `number | bigint | string` for Uint)

**Reference the completed primitives:**
- Hash: Simple example, all methods in one file
- Hex: Moderate complexity, separate method files, 15 wrappers
- Uint: Complex example, 30+ wrappers, handles optional parameters

### 2. Update Tests

**Issue:** Tests currently use the old `.call()` API:
```typescript
// Old API (still works with _ prefix)
const hex = Hash.toHex.call(hash);
const same = Hash.equals.call(hash1, hash2);
```

**Goal:** Update tests to use the new clean API:
```typescript
// New API (no .call() needed)
const hex = Hash.toHex(hash);
const same = Hash.equals(hash1, hash2);
```

**Files needing updates:**
- `src/primitives/Hash/Hash.test.ts`
- `src/primitives/Hash/Hash.bench.ts`
- `src/primitives/Hex/Hex.test.ts`
- `src/primitives/Hex/Hex.bench.ts`
- `src/primitives/Uint/Uint.test.ts`
- `src/primitives/Uint/Uint.bench.ts`
- All test files in other primitives after pattern is applied
- `src/crypto/keccak256.test.ts` (uses Hash)
- `src/crypto/eip712.test.ts` (uses Hash)

**Strategy:**
1. For each test file, search for `.call(` pattern
2. Replace `Method.call(value, ...args)` with `Method(value, ...args)`
3. Keep `_method.call()` usage if any exists (advanced API)
4. Run `zig build test` after each file to verify

### 3. Update Documentation

**Files to update:**
- Update code examples in `REFACTOR_PATTERN.md` to show completed implementations
- Update any primitive-specific `.md` files (e.g., `src/primitives/Hash/hash.md`)
- Update main README if it has API examples

**Example updates needed:**
```typescript
// OLD (in docs)
const hex = Hash.toHex.call(hash);

// NEW (update to)
const hex = Hash.toHex(hash);
// Or for advanced users:
const hex = Hash._toHex.call(hash);
```

## Implementation Order

1. **Apply pattern to remaining primitives** (start with simpler ones):
   - Hardfork (likely simplest)
   - GasConstants
   - Opcode
   - Authorization
   - AccessList
   - Bytecode
   - FeeMarket
   - State
   - EventLog
   - Siwe
   - Blob
   - Rlp
   - Transaction (complex)
   - Address (most complex - needs full refactor from Class pattern)

2. **Update all tests** (do this after primitives are done):
   - Run `zig build` first to get TypeScript errors
   - Fix each error by updating test API usage
   - Verify with `zig build test`

3. **Update documentation**:
   - Search for `.call(` in all `.md` files
   - Update code examples to new API

## Verification

After completion, verify:
1. ✅ `zig build` passes with no TypeScript errors
2. ✅ `zig build test` passes all tests
3. ✅ Both old API (`_method.call()`) and new API (`method()`) work
4. ✅ All primitives follow the same pattern structure
5. ✅ Documentation examples use new API

## Reference Examples

### Hash Example (simple, one file)
- File: `src/primitives/Hash/Hash.ts`
- Pattern: All methods in one file, renamed to `_method`, added wrappers at end
- Methods: 8 wrappers (toHex, toBytes, toString, equals, isZero, clone, slice, format)

### Hex Example (moderate, separate files)
- File: `src/primitives/Hex/Hex.ts`
- Pattern: Separate method files, export as `_method`, import and wrap
- Methods: 15 wrappers for `this:` methods
- Note: `from()` just returns string as-is since Hex is already a string type

### Uint Example (complex, many methods)
- File: `src/primitives/Uint/Uint.ts`
- Pattern: Same as Hex but with 30+ methods
- Methods: Conversions, arithmetic, bitwise, comparisons, utilities
- Note: Handles optional parameters (e.g., `toHex(value, padded = true)`)

## Key Principles

1. **Don't modify individual method files** - they stay with `this:` parameter
2. **Both APIs work** - old `_method.call()` and new `method()` both supported
3. **Type unions for `from()`** - make construction easy (e.g., `string | Uint8Array`)
4. **Consistent naming** - internal = `_method`, public = `method`
5. **Complete documentation** - every wrapper has JSDoc with examples
6. **Test both APIs** - tests can use either pattern

## Questions?

Refer to:
- `REFACTOR_PATTERN.md` - Original pattern specification
- `src/primitives/Hash/Hash.ts` - Simple reference implementation
- `src/primitives/Hex/Hex.ts` - Moderate reference implementation
- `src/primitives/Uint/Uint.ts` - Complex reference implementation
