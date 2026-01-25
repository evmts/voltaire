# Fix Receipt Pre-Byzantium Status Handling

<issue>
<metadata>
  <priority>P2</priority>
  <category>ethereum-compatibility</category>
  <complexity>medium</complexity>
  <estimated_effort>2 hours</estimated_effort>
  <files>
    - src/primitives/Receipt/from.js
    - src/primitives/Receipt/ReceiptSchema.ts
    - src/primitives/Receipt/ReceiptType.ts
    - src/primitives/Receipt/isPreByzantium.js
    - src/primitives/Receipt/wasSuccessful.js
  </files>
  <related_reviews>
    - 093-receipt-eventlog-review.md
    - 084-eip-compliance-gaps.md
  </related_reviews>
</metadata>

<context>
## Ethereum History: The Byzantium Fork

The **Byzantium hard fork** occurred at **block 4,370,000** on **October 16, 2017**. It was part of the larger Metropolis upgrade and introduced several important changes.

### EIP-658: Transaction Status Code

Before Byzantium, transaction receipts contained a 32-byte `root` field representing the intermediate state root after execution. This was useful for light clients but expensive to compute.

**EIP-658** replaced this with a simple 1-byte `status` code:
- `0` = Transaction failed (reverted)
- `1` = Transaction succeeded

This change:
- Reduced receipt size by ~31 bytes
- Eliminated expensive state root computation
- Simplified success/failure detection

### Pre-Byzantium Receipt Structure
```
Receipt {
  root: bytes32,           // Intermediate state root
  cumulativeGasUsed: uint64,
  logsBloom: bytes256,
  logs: Log[]
}
```

### Post-Byzantium Receipt Structure (EIP-658)
```
Receipt {
  status: uint8,           // 0 = failed, 1 = success
  cumulativeGasUsed: uint64,
  logsBloom: bytes256,
  logs: Log[]
}
```

### Archive Node Compatibility
Archive nodes store the complete blockchain history including pre-Byzantium blocks. Any receipt library must handle both formats to support:
- Historical data analysis
- Pre-2017 transaction verification
- Full archival queries
</context>

<problem>
Receipt validation requires `status` field, but pre-Byzantium receipts (before block 4,370,000) use `root` instead. Historical data queries fail.

```javascript
// src/primitives/Receipt/from.js - Current (wrong for pre-Byzantium)
if (data.status === undefined) {
  throw new InvalidReceiptError("status is required");
}
```

```typescript
// src/primitives/Receipt/ReceiptSchema.ts - Only validates post-Byzantium
"status" in receipt &&
(receipt.status === 0 || receipt.status === 1)
```

**Impact:**
- Cannot parse pre-October 2017 transactions
- Archive node queries fail for early blocks
- Historical analytics impossible
- Breaks compatibility with Ethereum's full history
</problem>

<solution>
Support both formats with proper validation. A receipt must have either `status` OR `root`, never neither.

### Updated Type Definition

```typescript
// src/primitives/Receipt/ReceiptType.ts
import type { AddressType } from "../Address/AddressType.js";
import type { Bytes32Type } from "../Bytes32/Bytes32Type.js";
import type { LogType } from "../Log/LogType.js";

export interface ReceiptType {
  // Common fields (all eras)
  transactionHash: Bytes32Type;
  blockHash: Bytes32Type;
  blockNumber: bigint;
  transactionIndex: number;
  from: AddressType;
  to: AddressType | null; // null for contract creation
  cumulativeGasUsed: bigint;
  gasUsed: bigint;
  logs: readonly LogType[];
  logsBloom: Uint8Array; // 256 bytes
  type: number; // Transaction type (0 = legacy, 1 = EIP-2930, 2 = EIP-1559)
  
  // EIP-1559 fields (optional)
  effectiveGasPrice?: bigint;
  
  // Post-Byzantium (EIP-658, block >= 4,370,000)
  // 0 = transaction failed, 1 = transaction succeeded
  status?: 0 | 1;
  
  // Pre-Byzantium (block < 4,370,000)
  // 32-byte intermediate state root after tx execution
  root?: Bytes32Type;
}
```

### Updated Factory Function

```javascript
// src/primitives/Receipt/from.js
import { InvalidReceiptError } from "./errors.js";

/**
 * Creates a Receipt from input data.
 * Supports both pre-Byzantium (root) and post-Byzantium (status) formats.
 * 
 * @param {object} data - Receipt data from RPC or other source
 * @returns {ReceiptType} Validated receipt
 * @throws {InvalidReceiptError} If neither status nor root is present
 */
export const from = (data) => {
  // Validate: must have either status OR root, not neither
  if (data.status === undefined && data.root === undefined) {
    throw new InvalidReceiptError({
      message: "Receipt must have either 'status' (post-Byzantium) or 'root' (pre-Byzantium)",
      receipt: data,
    });
  }
  
  // Validate status if present
  if (data.status !== undefined && data.status !== 0 && data.status !== 1) {
    throw new InvalidReceiptError({
      message: `Invalid status: ${data.status}. Must be 0 or 1.`,
      receipt: data,
    });
  }
  
  // Validate root if present (should be 32 bytes)
  if (data.root !== undefined) {
    const rootBytes = typeof data.root === "string" 
      ? hexToBytes(data.root)
      : data.root;
    if (rootBytes.length !== 32) {
      throw new InvalidReceiptError({
        message: `Invalid root length: ${rootBytes.length}. Must be 32 bytes.`,
        receipt: data,
      });
    }
  }
  
  return {
    transactionHash: parseBytes32(data.transactionHash),
    blockHash: parseBytes32(data.blockHash),
    blockNumber: BigInt(data.blockNumber),
    transactionIndex: Number(data.transactionIndex),
    from: parseAddress(data.from),
    to: data.to ? parseAddress(data.to) : null,
    cumulativeGasUsed: BigInt(data.cumulativeGasUsed),
    gasUsed: BigInt(data.gasUsed),
    logs: data.logs.map(parseLog),
    logsBloom: parseBloom(data.logsBloom),
    type: Number(data.type ?? 0),
    ...(data.effectiveGasPrice !== undefined && { 
      effectiveGasPrice: BigInt(data.effectiveGasPrice) 
    }),
    ...(data.status !== undefined && { status: data.status }),
    ...(data.root !== undefined && { root: parseBytes32(data.root) }),
  };
};
```

### Updated Schema

```typescript
// src/primitives/Receipt/ReceiptSchema.ts
import * as Schema from "effect/Schema";

export const ReceiptSchema = Schema.Struct({
  transactionHash: Bytes32Schema,
  blockHash: Bytes32Schema,
  blockNumber: Schema.BigInt,
  transactionIndex: Schema.Number,
  from: AddressSchema,
  to: Schema.NullOr(AddressSchema),
  cumulativeGasUsed: Schema.BigInt,
  gasUsed: Schema.BigInt,
  logs: Schema.Array(LogSchema),
  logsBloom: Schema.Uint8ArrayFromSelf.pipe(
    Schema.filter((bloom) => bloom.length === 256)
  ),
  type: Schema.Number,
  effectiveGasPrice: Schema.optional(Schema.BigInt),
  status: Schema.optional(Schema.Literal(0, 1)),
  root: Schema.optional(Bytes32Schema),
}).pipe(
  Schema.filter(
    (receipt) => receipt.status !== undefined || receipt.root !== undefined,
    { 
      message: () => "Receipt must have either 'status' (post-Byzantium) or 'root' (pre-Byzantium)" 
    }
  )
);
```

### Helper Functions

```javascript
// src/primitives/Receipt/isPreByzantium.js
/**
 * Checks if a receipt is from before the Byzantium fork.
 * Pre-Byzantium receipts have a 'root' field instead of 'status'.
 * 
 * @param {ReceiptType} receipt - The receipt to check
 * @returns {boolean} True if pre-Byzantium (has root, no status)
 */
export const isPreByzantium = (receipt) => 
  receipt.root !== undefined && receipt.status === undefined;
```

```javascript
// src/primitives/Receipt/isPostByzantium.js
/**
 * Checks if a receipt is from after the Byzantium fork.
 * Post-Byzantium receipts have a 'status' field.
 * 
 * @param {ReceiptType} receipt - The receipt to check
 * @returns {boolean} True if post-Byzantium (has status)
 */
export const isPostByzantium = (receipt) => 
  receipt.status !== undefined;
```

```javascript
// src/primitives/Receipt/wasSuccessful.js
/**
 * Checks if a transaction was successful.
 * Works for both pre-Byzantium and post-Byzantium receipts.
 * 
 * - Post-Byzantium: status === 1 means success
 * - Pre-Byzantium: presence of root indicates execution completed
 *   (Note: pre-Byzantium had no explicit failure indication;
 *    reverts would consume all gas but still produce a receipt)
 * 
 * @param {ReceiptType} receipt - The receipt to check
 * @returns {boolean} True if the transaction succeeded
 */
export const wasSuccessful = (receipt) => {
  if (receipt.status !== undefined) {
    // Post-Byzantium: explicit status
    return receipt.status === 1;
  }
  // Pre-Byzantium: root present means execution completed
  // Note: This doesn't distinguish between success and revert
  // in pre-Byzantium, but matches historical behavior
  return receipt.root !== undefined;
};
```
</solution>

<implementation>
<steps>
1. Update ReceiptType.ts to make `status` optional and add `root`
2. Update from.js validation to accept either field
3. Update ReceiptSchema.ts with Schema.filter for XOR validation
4. Create isPreByzantium.js helper
5. Create isPostByzantium.js helper
6. Create wasSuccessful.js helper that works for both eras
7. Export all new helpers from index.ts
8. Add comprehensive tests for both receipt formats
</steps>

<patterns>
- **Union validation with Effect Schema**: Use Schema.filter for complex constraints
- **Historical Ethereum compatibility**: Support all blockchain eras
- **Discriminated types**: Use presence of fields to distinguish formats
- **Helper functions for common checks**: Encapsulate era detection logic
</patterns>

<viem_reference>
Viem handles pre-Byzantium receipts in its receipt parsing:
- Uses optional `status` and `root` fields
- [src/types/transaction.ts](https://github.com/wevm/viem/blob/main/src/types/transaction.ts) - TransactionReceipt type
</viem_reference>

<voltaire_reference>
- [src/primitives/Receipt/Receipt.zig#L26-L234](file:///Users/williamcory/voltaire/src/primitives/Receipt/Receipt.zig#L26-L234) - Zig implementation with both fields
- [src/primitives/Receipt/isPreByzantium.js](file:///Users/williamcory/voltaire/src/primitives/Receipt/isPreByzantium.js) - Existing helper
- [src/primitives/Receipt/assertValid.js](file:///Users/williamcory/voltaire/src/primitives/Receipt/assertValid.js) - Validation logic
</voltaire_reference>
</implementation>

<tests>
```typescript
// src/primitives/Receipt/Receipt.test.ts
import { describe, it, expect } from "vitest";
import * as Receipt from "./index.js";
import * as Schema from "effect/Schema";
import { Effect } from "effect";

// Test fixtures
const baseFields = {
  transactionHash: "0x" + "ab".repeat(32),
  blockHash: "0x" + "cd".repeat(32),
  blockNumber: "0x100",
  transactionIndex: "0x0",
  from: "0x" + "11".repeat(20),
  to: "0x" + "22".repeat(20),
  cumulativeGasUsed: "0x5208",
  gasUsed: "0x5208",
  logs: [],
  logsBloom: "0x" + "00".repeat(256),
  type: "0x0",
};

describe("Receipt historical compatibility", () => {
  describe("post-Byzantium receipts (status field)", () => {
    it("accepts receipt with status: 1 (success)", () => {
      const receipt = Receipt.from({
        ...baseFields,
        status: "0x1",
      });
      expect(receipt.status).toBe(1);
      expect(receipt.root).toBeUndefined();
    });

    it("accepts receipt with status: 0 (failed)", () => {
      const receipt = Receipt.from({
        ...baseFields,
        status: "0x0",
      });
      expect(receipt.status).toBe(0);
    });

    it("status 0 indicates failed transaction", () => {
      const receipt = Receipt.from({ ...baseFields, status: "0x0" });
      expect(Receipt.wasSuccessful(receipt)).toBe(false);
    });

    it("status 1 indicates successful transaction", () => {
      const receipt = Receipt.from({ ...baseFields, status: "0x1" });
      expect(Receipt.wasSuccessful(receipt)).toBe(true);
    });

    it("detects post-Byzantium receipt", () => {
      const receipt = Receipt.from({ ...baseFields, status: "0x1" });
      expect(Receipt.isPostByzantium(receipt)).toBe(true);
      expect(Receipt.isPreByzantium(receipt)).toBe(false);
    });
  });

  describe("pre-Byzantium receipts (root field)", () => {
    const stateRoot = "0x" + "ab".repeat(32);

    it("accepts receipt with root field", () => {
      const receipt = Receipt.from({
        ...baseFields,
        root: stateRoot,
      });
      expect(receipt.root).toBeDefined();
      expect(receipt.root?.length).toBe(32);
      expect(receipt.status).toBeUndefined();
    });

    it("pre-Byzantium receipts with root are considered successful", () => {
      const receipt = Receipt.from({ ...baseFields, root: stateRoot });
      expect(Receipt.wasSuccessful(receipt)).toBe(true);
    });

    it("detects pre-Byzantium receipt", () => {
      const receipt = Receipt.from({ ...baseFields, root: stateRoot });
      expect(Receipt.isPreByzantium(receipt)).toBe(true);
      expect(Receipt.isPostByzantium(receipt)).toBe(false);
    });

    it("validates root is 32 bytes", () => {
      expect(() => Receipt.from({
        ...baseFields,
        root: "0x" + "ab".repeat(31), // Too short
      })).toThrow(/root.*32 bytes/i);
    });
  });

  describe("validation", () => {
    it("rejects receipt with neither status nor root", () => {
      expect(() => Receipt.from({ ...baseFields })).toThrow(
        /must have either.*status.*or.*root/i
      );
    });

    it("accepts receipt with both status and root", () => {
      // Some RPC implementations return both for compatibility
      const receipt = Receipt.from({
        ...baseFields,
        status: "0x1",
        root: "0x" + "ab".repeat(32),
      });
      expect(receipt.status).toBe(1);
      expect(receipt.root).toBeDefined();
    });

    it("rejects invalid status value", () => {
      expect(() => Receipt.from({
        ...baseFields,
        status: "0x2", // Invalid: must be 0 or 1
      })).toThrow(/invalid status/i);
    });
  });

  describe("era detection helpers", () => {
    it("isPostByzantium returns true for status receipts", () => {
      const receipt = Receipt.from({ ...baseFields, status: "0x1" });
      expect(Receipt.isPostByzantium(receipt)).toBe(true);
    });

    it("isPreByzantium returns true for root-only receipts", () => {
      const receipt = Receipt.from({ ...baseFields, root: "0x" + "00".repeat(32) });
      expect(Receipt.isPreByzantium(receipt)).toBe(true);
    });

    it("receipt with both is considered post-Byzantium", () => {
      const receipt = Receipt.from({
        ...baseFields,
        status: "0x1",
        root: "0x" + "00".repeat(32),
      });
      // Has status, so post-Byzantium
      expect(Receipt.isPostByzantium(receipt)).toBe(true);
    });
  });

  describe("wasSuccessful helper", () => {
    it("returns true for status=1", () => {
      const receipt = Receipt.from({ ...baseFields, status: "0x1" });
      expect(Receipt.wasSuccessful(receipt)).toBe(true);
    });

    it("returns false for status=0", () => {
      const receipt = Receipt.from({ ...baseFields, status: "0x0" });
      expect(Receipt.wasSuccessful(receipt)).toBe(false);
    });

    it("returns true for pre-Byzantium with root", () => {
      const receipt = Receipt.from({ ...baseFields, root: "0x" + "ab".repeat(32) });
      expect(Receipt.wasSuccessful(receipt)).toBe(true);
    });
  });
});

describe("ReceiptSchema", () => {
  it("validates post-Byzantium receipt", async () => {
    const result = await Effect.runPromise(
      Schema.decodeUnknown(Receipt.ReceiptSchema)({
        ...baseFields,
        status: 1,
      })
    );
    expect(result.status).toBe(1);
  });

  it("validates pre-Byzantium receipt", async () => {
    const result = await Effect.runPromise(
      Schema.decodeUnknown(Receipt.ReceiptSchema)({
        ...baseFields,
        root: new Uint8Array(32),
      })
    );
    expect(result.root).toBeDefined();
  });

  it("rejects receipt without status or root", async () => {
    const result = await Effect.runPromise(
      Effect.either(Schema.decodeUnknown(Receipt.ReceiptSchema)(baseFields))
    );
    expect(result._tag).toBe("Left");
  });
});

describe("Real-world receipt examples", () => {
  it("parses mainnet post-Byzantium receipt", () => {
    // Real receipt from Ethereum mainnet (post-Byzantium)
    const receipt = Receipt.from({
      transactionHash: "0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b",
      blockHash: "0x1d59ff54b1eb26b013ce3cb5fc9dab3705b415a67127a003c3e61eb445bb8df2",
      blockNumber: "0x5daf3b",
      transactionIndex: "0x0",
      from: "0xa7d9ddbe1f17865597fbd27ec712455208b6b76d",
      to: "0xf02c1c8e6114b1dbe8937a39260b5b0a374432bb",
      cumulativeGasUsed: "0x33bc",
      gasUsed: "0x4dc",
      logs: [],
      logsBloom: "0x" + "00".repeat(256),
      status: "0x1",
      type: "0x0",
    });
    
    expect(receipt.status).toBe(1);
    expect(Receipt.wasSuccessful(receipt)).toBe(true);
  });

  it("parses pre-Byzantium receipt (block < 4,370,000)", () => {
    // Simulated pre-Byzantium receipt
    const receipt = Receipt.from({
      transactionHash: "0x" + "aa".repeat(32),
      blockHash: "0x" + "bb".repeat(32),
      blockNumber: "0x1", // Very early block
      transactionIndex: "0x0",
      from: "0x" + "11".repeat(20),
      to: "0x" + "22".repeat(20),
      cumulativeGasUsed: "0x5208",
      gasUsed: "0x5208",
      logs: [],
      logsBloom: "0x" + "00".repeat(256),
      root: "0x" + "ff".repeat(32), // State root instead of status
      type: "0x0",
    });
    
    expect(receipt.root).toBeDefined();
    expect(receipt.status).toBeUndefined();
    expect(Receipt.isPreByzantium(receipt)).toBe(true);
  });
});
```
</tests>

<docs>
```typescript
/**
 * @module Receipt
 * 
 * Transaction receipt handling with full historical compatibility.
 * 
 * ## Historical Compatibility
 * 
 * Ethereum receipts changed format at the **Byzantium hard fork** (block 4,370,000,
 * October 16, 2017). This module supports both formats:
 * 
 * ### Pre-Byzantium (< Oct 16, 2017)
 * ```typescript
 * interface PreByzantiumReceipt {
 *   root: Bytes32Type;  // 32-byte intermediate state root
 *   // ... other fields
 * }
 * ```
 * 
 * ### Post-Byzantium (EIP-658)
 * ```typescript
 * interface PostByzantiumReceipt {
 *   status: 0 | 1;  // 0 = failed, 1 = success
 *   // ... other fields
 * }
 * ```
 * 
 * ## Helper Functions
 * 
 * - `isPreByzantium(receipt)` - Check if receipt is from before Byzantium
 * - `isPostByzantium(receipt)` - Check if receipt is from after Byzantium
 * - `wasSuccessful(receipt)` - Check if transaction succeeded (works for both eras)
 * 
 * ## Example
 * 
 * ```typescript
 * import * as Receipt from 'voltaire-effect/primitives/Receipt'
 * 
 * const receipt = Receipt.from(rpcResponse)
 * 
 * if (Receipt.wasSuccessful(receipt)) {
 *   console.log('Transaction succeeded')
 * } else {
 *   console.log('Transaction failed')
 * }
 * 
 * if (Receipt.isPreByzantium(receipt)) {
 *   console.log('Historical receipt with state root:', receipt.root)
 * }
 * ```
 * 
 * @see https://eips.ethereum.org/EIPS/eip-658 - Transaction status code
 * @see https://eips.ethereum.org/EIPS/eip-609 - Byzantium hard fork meta
 */
```
</docs>

<api>
<before>
```typescript
// Only post-Byzantium receipts accepted
interface ReceiptType {
  status: 0 | 1;  // Required - breaks historical queries
  // No root field
}

// Parsing pre-Byzantium fails
Receipt.from(archiveNodeReceipt); // ❌ Error: status is required
```
</before>

<after>
```typescript
// Both eras supported
interface ReceiptType {
  status?: 0 | 1;      // Post-Byzantium (optional)
  root?: Bytes32Type;  // Pre-Byzantium (optional)
  // Must have at least one
}

// Helper functions for compatibility
Receipt.isPreByzantium(receipt);   // boolean - has root, no status
Receipt.isPostByzantium(receipt);  // boolean - has status
Receipt.wasSuccessful(receipt);    // boolean - works for both eras

// Parse any era
const oldReceipt = Receipt.from({ ...fields, root: stateRoot }); // ✅
const newReceipt = Receipt.from({ ...fields, status: 1 });       // ✅
```
</after>
</api>

<acceptance_criteria>
- [ ] Update ReceiptType.ts with optional status and root fields
- [ ] Update from.js to accept either field
- [ ] Update ReceiptSchema.ts with proper validation
- [ ] Create isPreByzantium.js helper
- [ ] Create isPostByzantium.js helper  
- [ ] Create wasSuccessful.js helper
- [ ] Export all helpers from index.ts
- [ ] Add tests for post-Byzantium receipts (status field)
- [ ] Add tests for pre-Byzantium receipts (root field)
- [ ] Add tests for receipts with both fields
- [ ] Add tests for validation errors
- [ ] `pnpm build` succeeds
- [ ] `pnpm test` passes
</acceptance_criteria>

<references>
- [EIP-658: Embedding transaction status code in receipts](https://eips.ethereum.org/EIPS/eip-658)
- [EIP-609: Byzantium hard fork meta](https://eips.ethereum.org/EIPS/eip-609)
- [Byzantium activated at block 4,370,000 (Oct 16, 2017)](https://etherscan.io/block/4370000)
- [Viem TransactionReceipt type](https://viem.sh/docs/glossary/types#transactionreceipt)
- [Review 093: Receipt/EventLog review](file:///Users/williamcory/voltaire/voltaire-effect/reviews/093-receipt-eventlog-review.md)
- [Voltaire Receipt.zig](file:///Users/williamcory/voltaire/src/primitives/Receipt/Receipt.zig#L26-L234)
</references>
</issue>
