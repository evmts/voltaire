# Review 094: Block and BlockHeader Primitives

<issue>
<metadata>
priority: P1-P2
files: [
  "voltaire-effect/src/primitives/Block/BlockSchema.ts",
  "voltaire-effect/src/primitives/Block/Rpc.ts",
  "voltaire-effect/src/primitives/Block/index.ts",
  "voltaire-effect/src/primitives/BlockHeader/BlockHeaderSchema.ts",
  "voltaire-effect/src/primitives/BlockHeader/Rpc.ts",
  "voltaire-effect/src/primitives/BlockHeader/calculateHash.ts",
  "voltaire-effect/src/primitives/BlockBody/BlockBodySchema.ts",
  "voltaire-effect/src/primitives/BlockBody/Rpc.ts",
  "voltaire-effect/src/primitives/BlockHash/Bytes.ts",
  "voltaire-effect/src/primitives/BlockHash/Hex.ts",
  "voltaire-effect/src/primitives/BlockNumber/BigInt.ts",
  "voltaire-effect/src/primitives/BlockNumber/Number.ts"
]
reviews: []
</metadata>

<module_overview>
<purpose>
Effect Schema wrappers for Block, BlockHeader, BlockBody, BlockHash, and BlockNumber primitives. These handle parsing RPC responses from `eth_getBlockByNumber`, `eth_getBlockByHash`, and block subscription events. Supports all hardforks: Legacy, London (EIP-1559), Shanghai (EIP-4895), Cancun (EIP-4844).
</purpose>
<current_status>
**MEDIUM severity** - The underlying voltaire implementation is solid with proper EIP support. However, the Effect wrappers have:
- RPC encode not implemented (breaks bidirectional Schema usage)
- Shallow validation (only checks 3 of 17+ required BlockHeader fields)
- Zero test coverage for primitive schemas
- Duplicate schema declarations across files
</current_status>
</module_overview>

<findings>
<critical>
### 1. RPC Encode Not Implemented (P0)

**Location**: `Block/Rpc.ts#L122-130`, `BlockHeader/Rpc.ts#L99-107`, `BlockBody/Rpc.ts#L91-99`

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

**Impact**:
- Cannot round-trip block data through Schema
- Cannot use `Schema.encode()` for API responses
- Cannot serialize blocks back to RPC format

### 2. BlockSchema Validation Too Shallow (P0)

**Location**: `Block/BlockSchema.ts#L76-87`

```typescript
const BlockSchema = Schema.declare(
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

</critical>
<high>
### 3. BlockHeaderSchema Only Validates 3 of 17+ Fields (P1)

**Location**: `BlockHeader/BlockHeaderSchema.ts#L7-13`

```typescript
const BlockHeaderTypeSchema = Schema.declare<BlockHeaderType>(
  (u): u is BlockHeaderType => {
    if (typeof u !== "object" || u === null) return false;
    return "parentHash" in u && "stateRoot" in u && "number" in u;
  },
);
```

Missing validation for: ommersHash, beneficiary, transactionsRoot, receiptsRoot, logsBloom, difficulty, gasLimit, gasUsed, timestamp, extraData, mixHash, nonce (all required), plus 5 optional EIP fields.

### 4. BlockBodySchema Missing Withdrawals Check (P1)

**Location**: `BlockBody/BlockBodySchema.ts#L7-13`

```typescript
(u): u is BlockBodyType => {
  if (typeof u !== "object" || u === null) return false;
  return "transactions" in u && "ommers" in u;
  // Missing: withdrawals for post-Shanghai
}
```

### 5. No Tests for Block Primitive Schemas (P1)

**Location**: `voltaire-effect/src/primitives/Block*/`

Zero test files exist for:
- Block/
- BlockHeader/
- BlockBody/
- BlockHash/
- BlockNumber/

Only service-level tests exist in `src/block/block.test.ts`.

</high>
<medium>
### 6. BlockNumber.Number Has Precision Warning but No Runtime Check (P2)

**Location**: `BlockNumber/Number.ts#L20-23`

```typescript
/**
 * Warning: Block numbers larger than Number.MAX_SAFE_INTEGER may lose precision.
 */
// No runtime check!
```

Should fail decode for unsafe integers:
```typescript
if (!Number.isSafeInteger(n)) {
  return ParseResult.fail(new ParseResult.Type(ast, n, 
    `Block number ${n} exceeds MAX_SAFE_INTEGER`));
}
```

### 7. Duplicate Schema Declarations (P2)

`BlockHashTypeSchema` declared in both `BlockHash/Bytes.ts` and `BlockHash/Hex.ts`.
`BlockNumberTypeSchema` declared in `BlockNumber/BigInt.ts`, `Hex.ts`, and `Number.ts`.

### 8. Error Messages Lose Stack Context (P2)

**Location**: Multiple Rpc.ts files

```typescript
catch (e) {
  return ParseResult.fail(
    new ParseResult.Type(ast, rpc, (e as Error).message),  // Loses stack
  );
}
```

</medium>
</findings>

<effect_improvements>
### Use Schema Composition for Deep Validation

```typescript
import { BlockHeader } from "@tevm/voltaire";

// Compose with nested schemas
const BlockSchema = S.Struct({
  header: BlockHeaderSchema,
  body: BlockBodySchema,
  hash: BlockHashSchema,
  size: S.BigIntFromSelf,
});
```

### Implement RPC Encode via Voltaire Helpers

```typescript
encode: (block, _options, _ast) => {
  // Add toRpc to voltaire, then:
  return ParseResult.succeed(Block.toRpc(block));
},
```

### Add Schema.brand for Type Safety

```typescript
const BlockHashSchema = S.Uint8ArrayFromSelf.pipe(
  S.filter((a) => a.length === 32),
  S.brand("BlockHash")
);
```
</effect_improvements>

<viem_comparison>
**viem Reference**: `src/types/block.ts`

viem uses strict typing per hardfork:
```typescript
type Block<TIncludeTransactions, TBlockTag, TTransaction> = {
  baseFeePerGas: bigint | null // EIP-1559
  blobGasUsed?: bigint // EIP-4844
  excessBlobGas?: bigint // EIP-4844
  withdrawals?: Withdrawal[] // EIP-4895
  // ...17 other required fields
}
```

viem validates all fields and uses discriminated unions for hardfork-specific shapes.
</viem_comparison>

<implementation>
<refactoring_steps>
1. **Implement toRpc in voltaire** - Add `Block.toRpc()`, `BlockHeader.toRpc()`, `BlockBody.toRpc()`
2. **Wire up RPC encode** - Call toRpc in Schema encode functions
3. **Deepen BlockSchema validation** - Validate header/body are proper objects
4. **Validate all BlockHeader fields** - Check all 17+ required fields
5. **Add post-Shanghai withdrawals check** - Validate when present
6. **Add Number overflow check** - Fail decode for unsafe integers
7. **Extract shared schemas** - Create `BlockHashTypeSchema.ts`, `BlockNumberTypeSchema.ts`
8. **Preserve error causes** - Wrap errors with `{ cause: e }`
</refactoring_steps>
<new_patterns>
```typescript
// Pattern: Hardfork-aware block parsing
const BlockRpc = S.Union(
  PreLondonBlockRpc,
  LondonBlockRpc,      // + baseFeePerGas
  ShanghaiBlockRpc,    // + withdrawals
  CancunBlockRpc,      // + blobGasUsed, excessBlobGas
);

// Pattern: Safe integer validation
const BlockNumberFromNumber = S.Number.pipe(
  S.filter(Number.isSafeInteger, {
    message: () => "Block number exceeds safe integer range"
  }),
  S.transform(S.BigIntFromSelf, {
    decode: (n) => BigInt(n),
    encode: (b) => Number(b),
  })
);
```
</new_patterns>
</implementation>

<tests>
<missing_coverage>
- BlockSchema decode success/failure cases
- BlockSchema encode (currently fails)
- BlockHeaderSchema all 17 fields validation
- BlockBodySchema with/without withdrawals
- BlockHash 32-byte validation
- BlockNumber safe integer bounds
- Edge cases: pre-London, post-Shanghai, EIP-4844 blocks
- Error message quality
</missing_coverage>
<test_code>
```typescript
// Block/Block.test.ts
import * as S from "effect/Schema";
import { describe, expect, it } from "vitest";
import { BlockSchema, BlockTypeSchema } from "./BlockSchema.js";
import { BlockRpc } from "./Rpc.js";

describe("BlockSchema", () => {
  const validBlock = {
    header: createValidHeader(),
    body: { transactions: [], ommers: [] },
    hash: new Uint8Array(32).fill(1),
    size: 1000n,
  };

  it("validates complete block", () => {
    const result = S.decodeSync(BlockTypeSchema)(validBlock);
    expect(result.hash.length).toBe(32);
  });

  it("rejects block with invalid header", () => {
    expect(() =>
      S.decodeSync(BlockTypeSchema)({ ...validBlock, header: "garbage" })
    ).toThrow();
  });

  it("rejects block with wrong hash length", () => {
    expect(() =>
      S.decodeSync(BlockTypeSchema)({
        ...validBlock,
        hash: new Uint8Array(16),
      })
    ).toThrow();
  });
});

describe("BlockRpc", () => {
  it("decodes mainnet block JSON", () => {
    const rpcBlock = {
      number: "0x10d4f",
      hash: "0x" + "ab".repeat(32),
      parentHash: "0x" + "cd".repeat(32),
      // ... all fields
    };
    const block = S.decodeSync(BlockRpc)(rpcBlock);
    expect(block.header.number).toBe(68943n);
  });

  it("decodes post-Shanghai block with withdrawals", () => {
    const rpcBlock = {
      // ... base fields
      withdrawals: [
        { index: "0x0", validatorIndex: "0x1", address: "0x...", amount: "0x..." }
      ],
      withdrawalsRoot: "0x" + "ef".repeat(32),
    };
    const block = S.decodeSync(BlockRpc)(rpcBlock);
    expect(block.body.withdrawals?.length).toBe(1);
  });
});

describe("BlockNumber.Number", () => {
  it("decodes safe integers", () => {
    const result = S.decodeSync(BlockNumber.Number)(12345);
    expect(result).toBe(12345n);
  });

  it("rejects unsafe integers", () => {
    expect(() =>
      S.decodeSync(BlockNumber.Number)(Number.MAX_SAFE_INTEGER + 10)
    ).toThrow("exceeds");
  });
});
```
</test_code>
</tests>

<docs>
- Add JSDoc documenting hardfork field requirements
- Document which fields are required for which hardfork
- Add examples for parsing mainnet blocks at different eras
- Document BlockNumber precision limits
</docs>

<api>
<changes>
1. Add `Block.toRpc()`, `BlockHeader.toRpc()`, `BlockBody.toRpc()` to voltaire
2. Implement RPC encode in all Rpc.ts schemas
3. Add `BlockHashTypeSchema.ts` shared module
4. Add `BlockNumberTypeSchema.ts` shared module
5. Export hardfork-specific block schemas
6. Add `Schema.is()` convenience type guards
</changes>
</api>

<references>
- [EIP-1559: Fee market change](https://eips.ethereum.org/EIPS/eip-1559)
- [EIP-4895: Beacon chain withdrawals](https://eips.ethereum.org/EIPS/eip-4895)
- [EIP-4844: Shard Blob Transactions](https://eips.ethereum.org/EIPS/eip-4844)
- [Ethereum Yellow Paper - Block Structure](https://ethereum.github.io/yellowpaper/paper.pdf)
- [Effect Schema docs](https://effect.website/docs/schema)
</references>
</issue>
