# Review 094: Block and BlockHeader Primitives

**Modules**: `Block`, `BlockHeader`, `BlockBody`, `BlockHash`, `BlockNumber`  
**Severity**: Medium  
**Status**: Open

## Summary

The Block primitives in voltaire-effect provide Effect-TS Schema wrappers around the core voltaire Block types. The underlying voltaire implementation is solid with proper EIP support, but the Effect wrappers have gaps in validation depth, encoding support, and test coverage.

## Critical Issues

### 1. RPC Encode Not Implemented

**Location**: [Block/Rpc.ts#L122-130](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Block/Rpc.ts#L122-L130), [BlockHeader/Rpc.ts#L99-107](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/BlockHeader/Rpc.ts#L99-L107), [BlockBody/Rpc.ts#L91-99](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/BlockBody/Rpc.ts#L91-L99)

All three RPC schemas fail on encode:

```typescript
encode: (_block, _options, ast) => {
  return ParseResult.fail(
    new ParseResult.Type(
      ast,
      _block,
      "Encoding Block to RPC format is not yet supported",
    ),
  );
},
```

This breaks bidirectional Schema usage. Users cannot:
- Round-trip block data
- Use `Schema.encode()` for API responses
- Serialize blocks back to RPC format

**Fix**: Implement `toRpc()` functions in voltaire and wire them up:
```typescript
encode: (block, _options, _ast) => {
  return ParseResult.succeed(Block.toRpc(block));
},
```

### 2. BlockSchema Validation Too Shallow

**Location**: [Block/BlockSchema.ts#L76-87](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Block/BlockSchema.ts#L76-L87)

The schema only checks field existence, not field types:

```typescript
export const BlockSchema: Schema.Schema<BlockType> = Schema.declare(
  (input: unknown): input is BlockType => {
    if (typeof input !== "object" || input === null) return false;
    const block = input as Record<string, unknown>;
    return (
      "header" in block &&
      "body" in block &&
      "hash" in block &&
      block.hash instanceof Uint8Array &&  // Only validates hash!
      "size" in block &&
      typeof block.size === "bigint"
    );
  },
);
```

Accepts invalid data like:
```typescript
{ header: "garbage", body: null, hash: new Uint8Array(32), size: 0n }
```

**Fix**: Either:
1. Deep validate with nested Schema composition
2. Or call voltaire validation functions

### 3. BlockHeaderSchema Only Checks 3 Fields

**Location**: [BlockHeader/BlockHeaderSchema.ts#L7-13](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/BlockHeader/BlockHeaderSchema.ts#L7-L13)

```typescript
const BlockHeaderTypeSchema = Schema.declare<BlockHeaderType>(
  (u): u is BlockHeaderType => {
    if (typeof u !== "object" || u === null) return false;
    return "parentHash" in u && "stateRoot" in u && "number" in u;
  },
);
```

BlockHeaderType has 17+ required fields (parentHash, ommersHash, beneficiary, stateRoot, transactionsRoot, receiptsRoot, logsBloom, difficulty, number, gasLimit, gasUsed, timestamp, extraData, mixHash, nonce) plus 5 optional EIP fields.

Schema only validates 3 fields exist.

**Fix**: Validate all required fields or use deeper Schema composition.

### 4. BlockBodySchema Missing withdrawals Check

**Location**: [BlockBody/BlockBodySchema.ts#L7-13](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/BlockBody/BlockBodySchema.ts#L7-L13)

```typescript
const BlockBodyTypeSchema = Schema.declare<BlockBodyType>(
  (u): u is BlockBodyType => {
    if (typeof u !== "object" || u === null) return false;
    return "transactions" in u && "ommers" in u;
  },
);
```

Post-Shanghai blocks have `withdrawals`. Schema doesn't distinguish pre/post-Shanghai and doesn't validate withdrawal structure when present.

## Medium Issues

### 5. No Tests for Block Primitive Schemas

**Location**: `voltaire-effect/src/primitives/Block*/`

Zero test files in:
- Block/
- BlockHeader/
- BlockBody/
- BlockHash/
- BlockNumber/

The `block.test.ts` in `voltaire-effect/src/block/` tests service-level functions (fetchBlock, fetchBlockByHash), not the Schema primitives.

Missing test coverage:
- Schema.decode() success/failure cases
- Schema.encode() (currently fails)
- Edge cases (pre-London, post-Shanghai, EIP-4844)
- Error message quality

**Fix**: Create test files for each primitive:
- `Block/Block.test.ts`
- `BlockHeader/BlockHeader.test.ts`
- `BlockBody/BlockBody.test.ts`
- `BlockHash/BlockHash.test.ts`
- `BlockNumber/BlockNumber.test.ts`

### 6. BlockNumber.Number Has Precision Warning but No Runtime Check

**Location**: [BlockNumber/Number.ts#L20-23](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/BlockNumber/Number.ts#L20-L23)

```typescript
/**
 * Warning: Block numbers larger than Number.MAX_SAFE_INTEGER (2^53-1) may lose precision.
 * Use BigInt schema for large block numbers.
 */
```

No runtime check for unsafe integers. Silently loses precision:
```typescript
S.decodeSync(BlockNumber.Number)(Number.MAX_SAFE_INTEGER + 10)
// Silently rounds, no error
```

**Fix**: Add runtime check in decode:
```typescript
if (!Number.isSafeInteger(n)) {
  return ParseResult.fail(new ParseResult.Type(ast, n, 
    `Block number ${n} exceeds MAX_SAFE_INTEGER, use BlockNumber.BigInt`));
}
```

### 7. Duplicate Schema Declarations

**Location**: Multiple files

`BlockHashTypeSchema` declared in both:
- [BlockHash/Bytes.ts#L13-16](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/BlockHash/Bytes.ts#L13-L16)
- [BlockHash/Hex.ts#L13-16](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/BlockHash/Hex.ts#L13-L16)

`BlockNumberTypeSchema` declared in:
- [BlockNumber/BigInt.ts#L13-16](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/BlockNumber/BigInt.ts#L13-L16)
- [BlockNumber/Hex.ts#L13-16](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/BlockNumber/Hex.ts#L13-L16)
- [BlockNumber/Number.ts#L13-16](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/BlockNumber/Number.ts#L13-L16)

**Fix**: Extract to shared `BlockHashTypeSchema.ts` / `BlockNumberTypeSchema.ts` and import.

## Schema Completeness Assessment

### EIP-1559 (London) Fields ✅ Present

**Location**: [BlockHeader/Rpc.ts#L52](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/BlockHeader/Rpc.ts#L52)

```typescript
baseFeePerGas: S.optional(S.String),
```

Properly optional for pre-London blocks.

### EIP-4895 (Shanghai) Withdrawal Fields ✅ Present

**Location**: [BlockHeader/Rpc.ts#L53](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/BlockHeader/Rpc.ts#L53), [Block/Rpc.ts#L84](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Block/Rpc.ts#L84)

```typescript
withdrawalsRoot: S.optional(S.String),  // Header
withdrawals: S.optional(S.Array(RpcWithdrawalSchema)),  // Body
```

RpcWithdrawalSchema properly validates:
```typescript
const RpcWithdrawalSchema = S.Struct({
  index: S.String,
  validatorIndex: S.String,
  address: S.String,
  amount: S.String,
});
```

### EIP-4844 (Cancun) Blob Fields ✅ Present

**Location**: [BlockHeader/Rpc.ts#L54-56](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/BlockHeader/Rpc.ts#L54-L56)

```typescript
blobGasUsed: S.optional(S.String),
excessBlobGas: S.optional(S.String),
parentBeaconBlockRoot: S.optional(S.String),
```

All three EIP-4844 fields present and optional.

### EIP-4788 Beacon Root ✅ Present

`parentBeaconBlockRoot` included above.

## Header Hash Calculation ✅ Correct

**Location**: [BlockHeader/calculateHash.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/BlockHeader/calculateHash.ts)

Effect wrapper correctly delegates to voltaire:
```typescript
export const calculateHash = (header: BlockHeaderType): BlockHashType =>
  BlockHeader.calculateHash(header);
```

Underlying implementation in [voltaire/src/primitives/BlockHeader/calculateHash.js](file:///Users/williamcory/voltaire/src/primitives/BlockHeader/calculateHash.js):
- Proper canonical field ordering (15 base + optional EIP fields)
- Correct RLP encoding
- Keccak256 hash
- Handles all hardforks (Legacy, London, Shanghai, Cancun)

The RLP encoding correctly uses minimal bytes for integers:
```javascript
function bigintToMinimalBytes(value) {
  if (value === 0n) return new Uint8Array(0);
  return bytesFromBigInt(value);
}
```

## Minor Issues

### 8. Missing toRpc Export in Pure Functions

**Location**: [BlockHash/index.ts#L47-51](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/BlockHash/index.ts#L47-L51)

BlockHash exports `toHex` and `equals` but not all useful utilities. Consider adding common conversions.

### 9. Inconsistent Error Message Formatting

**Location**: Multiple Rpc.ts files

Error messages use `(e as Error).message` which may lose stack traces:

```typescript
catch (e) {
  return ParseResult.fail(
    new ParseResult.Type(ast, rpc, (e as Error).message),
  );
}
```

Consider wrapping the original error as cause for debugging.

## Test Coverage Assessment

### voltaire Core ✅ Tested

- [Block/Block.test.ts](file:///Users/williamcory/voltaire/src/primitives/Block/Block.test.ts) - from(), hash conversion
- [Block/rpc.test.ts](file:///Users/williamcory/voltaire/src/primitives/Block/rpc.test.ts) - RPC parsing
- [BlockHeader/BlockHeader.test.ts](file:///Users/williamcory/voltaire/src/primitives/BlockHeader/BlockHeader.test.ts) - All EIP fields
- [BlockHeader/calculateHash.test.ts](file:///Users/williamcory/voltaire/src/primitives/BlockHeader/calculateHash.test.ts) - Hash calculation
- [BlockBody/BlockBody.test.ts](file:///Users/williamcory/voltaire/src/primitives/BlockBody/BlockBody.test.ts)

### voltaire-effect ❌ No Tests

Zero test coverage for Schema primitives:
- Block/
- BlockHeader/
- BlockBody/
- BlockHash/
- BlockNumber/

Only service-level tests exist in `src/block/block.test.ts`.

## Recommendations

### P0 (Critical)

1. **Implement RPC encode** - Add `Block.toRpc()`, `BlockHeader.toRpc()`, `BlockBody.toRpc()` to voltaire and wire up in Rpc.ts encode functions
2. **Deepen Schema validation** - Validate all required fields, not just 3
3. **Add primitive tests** - Create test files for each Block* primitive

### P1 (High)

4. **Add Number overflow check** - Fail decode for unsafe integers
5. **Extract shared schemas** - Deduplicate type guard declarations

### P2 (Medium)

6. **Improve error wrapping** - Preserve original error as cause
7. **Document hardfork field requirements** - Which fields required for which hardfork

### P3 (Low)

8. **Add Schema.is() convenience** - Export type guards for runtime checks
9. **Consider Schema.brand()** - For additional type safety

## Files Reviewed

- [Block/BlockSchema.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Block/BlockSchema.ts)
- [Block/index.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Block/index.ts)
- [Block/Rpc.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Block/Rpc.ts)
- [BlockHeader/BlockHeaderSchema.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/BlockHeader/BlockHeaderSchema.ts)
- [BlockHeader/calculateHash.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/BlockHeader/calculateHash.ts)
- [BlockHeader/index.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/BlockHeader/index.ts)
- [BlockHeader/Rpc.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/BlockHeader/Rpc.ts)
- [BlockBody/BlockBodySchema.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/BlockBody/BlockBodySchema.ts)
- [BlockBody/index.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/BlockBody/index.ts)
- [BlockBody/Rpc.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/BlockBody/Rpc.ts)
- [BlockHash/Bytes.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/BlockHash/Bytes.ts)
- [BlockHash/Hex.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/BlockHash/Hex.ts)
- [BlockHash/index.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/BlockHash/index.ts)
- [BlockNumber/BigInt.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/BlockNumber/BigInt.ts)
- [BlockNumber/Hex.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/BlockNumber/Hex.ts)
- [BlockNumber/index.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/BlockNumber/index.ts)
- [BlockNumber/Number.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/BlockNumber/Number.ts)
- [voltaire/BlockType.ts](file:///Users/williamcory/voltaire/src/primitives/Block/BlockType.ts)
- [voltaire/BlockHeaderType.ts](file:///Users/williamcory/voltaire/src/primitives/BlockHeader/BlockHeaderType.ts)
- [voltaire/BlockBodyType.ts](file:///Users/williamcory/voltaire/src/primitives/BlockBody/BlockBodyType.ts)
- [voltaire/calculateHash.js](file:///Users/williamcory/voltaire/src/primitives/BlockHeader/calculateHash.js)
- [voltaire/fromRpc.js](file:///Users/williamcory/voltaire/src/primitives/Block/fromRpc.js)
- [voltaire/BlockHeader/fromRpc.js](file:///Users/williamcory/voltaire/src/primitives/BlockHeader/fromRpc.js)
- [voltaire/BlockBody/fromRpc.js](file:///Users/williamcory/voltaire/src/primitives/BlockBody/fromRpc.js)
