# Voltaire-Effect Schema Refactor Plan

## Overview

Refactor all voltaire-effect primitives from the current dual API (`from()` functions + Schemas) to a **Schema-only API** following Effect Schema conventions.

**Current (problematic):**
```typescript
// Two ways to do the same thing - confusing
const addr1 = await Effect.runPromise(Address.from('0x...'))
const addr2 = S.decodeSync(Address.AddressSchema)('0x...')
```

**Target (Schema-only):**
```typescript
import * as Address from 'voltaire-effect/primitives/Address'
import * as S from 'effect/Schema'

const addr = S.decodeSync(Address.Hex)('0x...')
const checksummed = S.encodeSync(Address.Checksummed)(addr)
```

---

## Effect Schema Conventions

### Pattern 1: Separate Schemas for Each Encoding

Effect uses separate named schemas for each input/output encoding:

```typescript
// Effect's built-in pattern:
S.BigIntFromSelf     // Schema<bigint, bigint>     - identity
S.BigInt             // Schema<bigint, string>     - from string
S.NumberFromString   // Schema<number, string>     - from string  
S.DateFromString     // Schema<Date, string>       - from ISO string
S.DateFromSelf       // Schema<Date, Date>         - identity
```

**Key insight:** Each schema has ONE input type (`Encoded`) and ONE output type (`Type`).

### Pattern 2: Bidirectional Transformations

Schemas are bidirectional:
- `decode`: `Encoded -> Type` (parse input)
- `encode`: `Type -> Encoded` (serialize output)

```typescript
// Schema<bigint, string> means:
// decode: string -> bigint
// encode: bigint -> string
```

### Pattern 3: Loose Input, Strict Output

Effect schemas typically accept loose input (e.g., `string`) and validate/parse it, rather than requiring pre-branded input.

---

## Type System for Voltaire Primitives

Each primitive should have:

### 1. Canonical Type (branded Uint8Array or similar)
```typescript
type AddressType = Uint8Array & { readonly __brand: 'Address', readonly length: 20 }
```

### 2. Encoded Representations (branded strings/arrays)
```typescript
type HexAddress = `0x${string}` & { readonly __brand: 'HexAddress' }
type ChecksummedAddress = `0x${string}` & { readonly __brand: 'ChecksummedAddress' }
```

### 3. Schemas for Each Encoding
```typescript
// Schema<AddressType, string> - loose string input, branded Address output
Address.Hex         // decode: hex string -> Address, encode: Address -> lowercase hex
Address.Checksummed // decode: checksummed string -> Address, encode: Address -> checksummed
Address.Bytes       // decode: Uint8Array -> Address, encode: Address -> Uint8Array
```

---

## Naming Conventions

Follow Effect's naming pattern:

| Voltaire Type | Schema Name | Schema Type |
|---------------|-------------|-------------|
| Address | `Address.Hex` | `Schema<AddressType, string>` |
| Address | `Address.Checksummed` | `Schema<AddressType, string>` |
| Address | `Address.Bytes` | `Schema<AddressType, Uint8Array>` |
| Hash | `Hash.Hex` | `Schema<HashType, string>` |
| Hash | `Hash.Bytes` | `Schema<HashType, Uint8Array>` |
| Uint256 | `Uint256.String` | `Schema<Uint256Type, string>` |
| Uint256 | `Uint256.Number` | `Schema<Uint256Type, number>` |
| Uint256 | `Uint256.BigInt` | `Schema<Uint256Type, bigint>` |

**Naming rules:**
- Schema name = `{PrimitiveName}.{EncodingName}`
- Encoding names: `Hex`, `Bytes`, `String`, `Number`, `BigInt`, `Checksummed`, `Rpc`, etc.
- Use `FromSelf` suffix for identity schemas (if needed): `Address.FromSelf`

---

## Pure Functions vs Schemas

### Keep as Pure Functions
Functions that:
- Don't parse/validate (can't fail)
- Return simple types (boolean, number)
- Are comparisons or predicates

```typescript
// Pure functions - keep these
Address.equals(a, b): boolean
Address.isZero(a): boolean
Address.compare(a, b): number
Address.lessThan(a, b): boolean
Address.greaterThan(a, b): boolean
Hash.equals(a, b): boolean
Uint.add(a, b): UintType  // arithmetic doesn't fail for valid inputs
```

### Convert to Schemas
Functions that:
- Parse input (can fail)
- Transform between types
- Have branded output types

```typescript
// Convert these to schemas
Address.from()      -> Address.Hex, Address.Bytes, etc.
Address.fromHex()   -> Address.Hex
Address.toHex()     -> use S.encodeSync(Address.Hex)
Address.toChecksummed() -> use S.encodeSync(Address.Checksummed)
```

---

## File Structure Changes

### Before (current structure):
```
Address/
├── AddressSchema.ts
├── AddressFromBytesSchema.ts
├── ChecksummedAddressSchema.ts
├── from.ts              # DELETE - replaced by schema
├── fromHex.ts           # DELETE - replaced by schema
├── fromBytes.ts         # DELETE - replaced by schema
├── toHex.ts             # DELETE - use encode
├── toChecksummed.ts     # DELETE - use encode
├── equals.ts            # KEEP - pure function
├── isZero.ts            # KEEP - pure function
├── index.ts
└── Address.test.ts
```

### After (target structure):
```
Address/
├── Hex.ts               # Schema<AddressType, string>
├── Checksummed.ts       # Schema<AddressType, string>  
├── Bytes.ts             # Schema<AddressType, Uint8Array>
├── equals.ts            # Pure function
├── isZero.ts            # Pure function
├── compare.ts           # Pure function
├── index.ts             # Re-exports all
└── Address.test.ts      # Updated tests
```

---

## Schema Implementation Pattern

### Template for a Schema File

```typescript
// Address/Hex.ts
import { Address, type AddressType } from "@tevm/voltaire/Address"
import * as ParseResult from "effect/ParseResult"
import * as S from "effect/Schema"

/**
 * Schema for Address encoded as a hex string.
 * 
 * @description
 * Transforms hex strings to AddressType and vice versa.
 * Accepts lowercase, uppercase, or checksummed hex input.
 * Encodes to lowercase hex.
 * 
 * @example Decoding
 * ```typescript
 * import * as Address from 'voltaire-effect/primitives/Address'
 * import * as S from 'effect/Schema'
 * 
 * const addr = S.decodeSync(Address.Hex)('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3')
 * ```
 * 
 * @example Encoding
 * ```typescript
 * const hex = S.encodeSync(Address.Hex)(addr)
 * // "0x742d35cc6634c0532925a3b844bc9e7595f251e3"
 * ```
 * 
 * @since 0.1.0
 */
export const Hex: S.Schema<AddressType, string> = S.transformOrFail(
  S.String,
  S.declare<AddressType>(
    (u): u is AddressType => u instanceof Uint8Array && u.length === 20,
    { identifier: "Address" }
  ),
  {
    strict: true,
    decode: (s, _options, ast) => {
      try {
        return ParseResult.succeed(Address(s))
      } catch (e) {
        return ParseResult.fail(
          new ParseResult.Type(ast, s, (e as Error).message)
        )
      }
    },
    encode: (addr, _options, _ast) => {
      return ParseResult.succeed(Address.toHex(addr))
    },
  }
).annotations({ identifier: "Address.Hex" })
```

### Index File Pattern

```typescript
// Address/index.ts
/**
 * @module Address
 * @description Effect Schemas for Ethereum addresses with EIP-55 checksum support.
 * 
 * @example
 * ```typescript
 * import * as Address from 'voltaire-effect/primitives/Address'
 * import * as S from 'effect/Schema'
 * 
 * // Parse hex string to Address
 * const addr = S.decodeSync(Address.Hex)('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3')
 * 
 * // Encode to checksummed format
 * const checksummed = S.encodeSync(Address.Checksummed)(addr)
 * 
 * // Pure utility functions
 * Address.equals(addr1, addr2)
 * Address.isZero(addr)
 * ```
 */

// Schemas
export { Hex } from "./Hex.js"
export { Checksummed } from "./Checksummed.js"
export { Bytes } from "./Bytes.js"

// Pure functions
export { equals } from "./equals.js"
export { isZero } from "./isZero.js"
export { compare } from "./compare.js"
export { lessThan } from "./lessThan.js"
export { greaterThan } from "./greaterThan.js"

// Re-export types from voltaire
export type { AddressType } from "@tevm/voltaire/Address"
```

---

## Primitives to Refactor

### High Priority (most used)
1. **Address** - Hex, Checksummed, Bytes
2. **Hash** - Hex, Bytes
3. **Hex** - String, Bytes, Number, BigInt
4. **Uint** (all sizes) - String, Number, BigInt, Bytes
5. **PrivateKey** - Hex, Bytes
6. **PublicKey** - Hex, Bytes, Compressed
7. **Signature** - Hex, Bytes, Compact, DER

### Medium Priority
8. **Transaction** - Serialized, Rpc
9. **Block** - Rpc
10. **Receipt** - Rpc
11. **AccessList** - Rpc
12. **Rlp** - Encoded, Decoded

### Lower Priority (simpler types)
13. **ChainId** - Number, BigInt
14. **Nonce** - Number, BigInt
15. **Gas** - Number, BigInt
16. **BlockNumber** - Number, BigInt, Hex
17. All remaining primitives in `voltaire-effect/src/primitives/`

---

## Testing Pattern

### Test File Template

```typescript
// Address/Address.test.ts
import * as Address from "./index.js"
import * as S from "effect/Schema"
import { describe, it, expect } from "vitest"

describe("Address.Hex", () => {
  describe("decode", () => {
    it("parses valid lowercase hex", () => {
      const addr = S.decodeSync(Address.Hex)("0x742d35cc6634c0532925a3b844bc9e7595f251e3")
      expect(addr).toBeInstanceOf(Uint8Array)
      expect(addr.length).toBe(20)
    })

    it("parses valid checksummed hex", () => {
      const addr = S.decodeSync(Address.Hex)("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3")
      expect(addr.length).toBe(20)
    })

    it("fails on invalid hex", () => {
      expect(() => S.decodeSync(Address.Hex)("invalid")).toThrow()
    })

    it("fails on wrong length", () => {
      expect(() => S.decodeSync(Address.Hex)("0x742d")).toThrow()
    })
  })

  describe("encode", () => {
    it("encodes to lowercase hex", () => {
      const addr = S.decodeSync(Address.Hex)("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3")
      const hex = S.encodeSync(Address.Hex)(addr)
      expect(hex).toBe("0x742d35cc6634c0532925a3b844bc9e7595f251e3")
    })
  })
})

describe("Address.Checksummed", () => {
  describe("decode", () => {
    it("parses valid checksummed address", () => {
      const addr = S.decodeSync(Address.Checksummed)("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3")
      expect(addr.length).toBe(20)
    })

    it("fails on invalid checksum", () => {
      // All lowercase is invalid checksum
      expect(() => S.decodeSync(Address.Checksummed)("0x742d35cc6634c0532925a3b844bc9e7595f251e3")).toThrow()
    })
  })

  describe("encode", () => {
    it("encodes to checksummed format", () => {
      const addr = S.decodeSync(Address.Hex)("0x742d35cc6634c0532925a3b844bc9e7595f251e3")
      const checksummed = S.encodeSync(Address.Checksummed)(addr)
      expect(checksummed).toBe("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3")
    })
  })
})

describe("pure functions", () => {
  it("equals", () => {
    const a = S.decodeSync(Address.Hex)("0x742d35cc6634c0532925a3b844bc9e7595f251e3")
    const b = S.decodeSync(Address.Hex)("0x742d35cc6634c0532925a3b844bc9e7595f251e3")
    const c = S.decodeSync(Address.Hex)("0x0000000000000000000000000000000000000000")
    expect(Address.equals(a, b)).toBe(true)
    expect(Address.equals(a, c)).toBe(false)
  })

  it("isZero", () => {
    const zero = S.decodeSync(Address.Hex)("0x0000000000000000000000000000000000000000")
    const nonZero = S.decodeSync(Address.Hex)("0x742d35cc6634c0532925a3b844bc9e7595f251e3")
    expect(Address.isZero(zero)).toBe(true)
    expect(Address.isZero(nonZero)).toBe(false)
  })
})
```

---

## Documentation Updates

### Module JSDoc Pattern

Each index.ts should have a comprehensive module JSDoc:

```typescript
/**
 * @module Address
 * @description Effect Schemas for Ethereum addresses with EIP-55 checksum support.
 * 
 * ## Schemas
 * 
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `Address.Hex` | hex string | AddressType |
 * | `Address.Checksummed` | checksummed string | AddressType |
 * | `Address.Bytes` | Uint8Array | AddressType |
 * 
 * ## Usage
 * 
 * ```typescript
 * import * as Address from 'voltaire-effect/primitives/Address'
 * import * as S from 'effect/Schema'
 * 
 * // Decode (parse input)
 * const addr = S.decodeSync(Address.Hex)('0x742d...')
 * 
 * // Encode (format output)
 * const hex = S.encodeSync(Address.Hex)(addr)
 * const checksummed = S.encodeSync(Address.Checksummed)(addr)
 * ```
 * 
 * ## Pure Functions
 * 
 * ```typescript
 * Address.equals(a, b)  // boolean
 * Address.isZero(addr)  // boolean
 * Address.compare(a, b) // -1 | 0 | 1
 * ```
 * 
 * @since 0.1.0
 */
```

---

## Orchestration Instructions

### For the Orchestrator Agent

1. **Read this document first** - Understand the full refactor plan
2. **Deploy subagents by primitive group** - Each subagent handles 2-3 related primitives
3. **Provide this document to each subagent** - They need full context
4. **Verify after each batch** - Run `pnpm tsc --noEmit` in voltaire-effect
5. **Run tests after completion** - `pnpm test:run`

### Subagent Task Template

```
**Task: Refactor {PrimitiveName} to Schema-only API**

Read: /Users/williamcory/voltaire/voltaire-effect/SCHEMA-REFACTOR-PLAN.md

Refactor /Users/williamcory/voltaire/voltaire-effect/src/primitives/{PrimitiveName}/:

1. Create schema files following the template in the plan:
   - {Encoding1}.ts (e.g., Hex.ts)
   - {Encoding2}.ts (e.g., Bytes.ts)
   
2. Keep pure function files:
   - equals.ts, isZero.ts, compare.ts, etc.
   
3. Delete deprecated files:
   - from.ts, fromHex.ts, toHex.ts, etc.
   
4. Update index.ts:
   - Export schemas and pure functions
   - Add module JSDoc
   
5. Update tests:
   - Use S.decodeSync/S.encodeSync pattern
   - Test both decode and encode directions
   
6. Verify: `cd voltaire-effect && pnpm tsc --noEmit`
```

### Subagent Groups

| Group | Primitives | Priority |
|-------|------------|----------|
| 1 | Address, Hash | High |
| 2 | Hex, Bytes, Bytes32 | High |
| 3 | Uint, Uint8, Uint16, Uint32, Uint64, Uint128, Uint256 | High |
| 4 | Int8, Int16, Int32, Int64, Int128, Int256 | High |
| 5 | PrivateKey, PublicKey | High |
| 6 | Signature | High |
| 7 | Transaction, Receipt | Medium |
| 8 | Block, BlockHeader, BlockBody | Medium |
| 9 | AccessList, Authorization | Medium |
| 10 | Rlp, Ssz | Medium |
| 11 | ChainId, NetworkId, Nonce, Gas, GasPrice | Low |
| 12 | BlockNumber, BlockHash, TransactionHash, TransactionIndex | Low |
| 13 | All remaining primitives (batch 1) | Low |
| 14 | All remaining primitives (batch 2) | Low |
| 15 | All remaining primitives (batch 3) | Low |
| 16 | Final cleanup, index.ts updates, docs | Low |

---

## Verification Checklist

After refactor, verify:

- [ ] `cd voltaire-effect && pnpm tsc --noEmit` passes
- [ ] `cd voltaire-effect && pnpm test:run` passes
- [ ] No `from()`, `fromHex()`, `toHex()` etc. Effect-wrapped functions remain
- [ ] All schemas follow `{Primitive}.{Encoding}` naming
- [ ] All index.ts files have module JSDoc
- [ ] All schema files have usage examples in JSDoc
- [ ] Pure functions remain as pure functions (not wrapped in Effect)

---

## Breaking Changes

This is a **breaking change** to the voltaire-effect API:

### Before (0.0.x)
```typescript
import * as Address from 'voltaire-effect/primitives/Address'

const addr = await Effect.runPromise(Address.from('0x...'))
const hex = Address.toHex(addr)
```

### After (0.1.0)
```typescript
import * as Address from 'voltaire-effect/primitives/Address'
import * as S from 'effect/Schema'

const addr = S.decodeSync(Address.Hex)('0x...')
const hex = S.encodeSync(Address.Hex)(addr)
```

Update CHANGELOG.md to document this breaking change.
