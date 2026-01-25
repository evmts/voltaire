# Add Missing ERC1155 Batch Methods

<issue>
<metadata>priority: P3, files: [voltaire-effect/src/standards/ERC1155.ts], reviews: [083-erc-standards-review.md]</metadata>

<problem>
ERC1155 module is missing batch operation encoders and event decoders that are core ERC-1155 functionality:
- `balanceOfBatch(address[] accounts, uint256[] ids)` - Gas-efficient batch balance queries
- `safeBatchTransferFrom(address, address, uint256[], uint256[], bytes)` - Batch transfers
- `decodeTransferBatchEvent(log)` - Decode TransferBatch events
- `decodeURIEvent(log)` - Decode URI change events

Batch operations are the primary advantage of ERC-1155 over ERC-20/721. Without these, users lose the gas efficiency benefits and must implement manually.
</problem>

<solution>
Add Effect-wrapped batch encoders, result decoders, and event decoders for all missing ERC1155 batch operations, following the existing pattern that wraps `@tevm/voltaire` implementations.
</solution>

<implementation>
<steps>
1. Add `encodeBalanceOfBatch`, `encodeSafeBatchTransferFrom` to ERC1155.ts
2. Add result decoder: `decodeBalanceOfBatchResult`
3. Add event decoders: `decodeTransferBatchEvent`, `decodeURIEvent`
4. Export from index.ts
5. Add comprehensive tests

```typescript
// voltaire-effect/src/standards/ERC1155.ts

export const encodeBalanceOfBatch = (
  accounts: readonly AddressType[],
  ids: readonly Uint256Type[],
): Effect.Effect<string, StandardsError> =>
  Effect.try({
    try: () => ERC1155Impl.encodeBalanceOfBatch(accounts, ids),
    catch: (e) =>
      new StandardsError({
        operation: "ERC1155.encodeBalanceOfBatch",
        message: e instanceof Error ? e.message : String(e),
        cause: e,
      }),
  });

export const decodeBalanceOfBatchResult = (
  data: string,
): Effect.Effect<readonly Uint256Type[], StandardsError> =>
  Effect.try({
    try: () => ERC1155Impl.decodeBalanceOfBatchResult(data),
    catch: (e) =>
      new StandardsError({
        operation: "ERC1155.decodeBalanceOfBatchResult",
        message: e instanceof Error ? e.message : String(e),
        cause: e,
      }),
  });

export const encodeSafeBatchTransferFrom = (
  from: AddressType,
  to: AddressType,
  ids: readonly Uint256Type[],
  amounts: readonly Uint256Type[],
  data?: Uint8Array,
): Effect.Effect<string, StandardsError> =>
  Effect.try({
    try: () => ERC1155Impl.encodeSafeBatchTransferFrom(from, to, ids, amounts, data),
    catch: (e) =>
      new StandardsError({
        operation: "ERC1155.encodeSafeBatchTransferFrom",
        message: e instanceof Error ? e.message : String(e),
        cause: e,
      }),
  });

export const decodeTransferBatchEvent = (log: {
  topics: string[];
  data: string;
}): Effect.Effect<
  {
    operator: string;
    from: string;
    to: string;
    ids: readonly Uint256Type[];
    values: readonly Uint256Type[];
  },
  StandardsError
> =>
  Effect.try({
    try: () => ERC1155Impl.decodeTransferBatchEvent(log),
    catch: (e) =>
      new StandardsError({
        operation: "ERC1155.decodeTransferBatchEvent",
        message: e instanceof Error ? e.message : String(e),
        cause: e,
      }),
  });

export const decodeURIEvent = (log: {
  topics: string[];
  data: string;
}): Effect.Effect<{ value: string; id: Uint256Type }, StandardsError> =>
  Effect.try({
    try: () => ERC1155Impl.decodeURIEvent(log),
    catch: (e) =>
      new StandardsError({
        operation: "ERC1155.decodeURIEvent",
        message: e instanceof Error ? e.message : String(e),
        cause: e,
      }),
  });
```
</steps>
<new_exports>encodeBalanceOfBatch, decodeBalanceOfBatchResult, encodeSafeBatchTransferFrom, decodeTransferBatchEvent, decodeURIEvent</new_exports>
</implementation>

<tests>
<test_cases>
```typescript
// voltaire-effect/src/standards/ERC1155.test.ts

import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import * as ERC1155 from "./ERC1155.js";
import * as Address from "../primitives/Address/index.js";
import * as Uint from "../primitives/Uint/index.js";

const TEST_OWNER = Address.from("0x1234567890123456789012345678901234567890");
const TEST_RECIPIENT = Address.from("0xabcdef0123456789abcdef0123456789abcdef01");
const TEST_OPERATOR = Address.from("0x9876543210987654321098765432109876543210");

describe("ERC1155 batch methods", () => {
  describe("encodeBalanceOfBatch", () => {
    it("encodes balanceOfBatch with single account/id", async () => {
      const accounts = [TEST_OWNER];
      const ids = [Uint.from(1n, 256)];
      const result = await Effect.runPromise(ERC1155.encodeBalanceOfBatch(accounts, ids));
      expect(result).toMatch(/^0x4e1273f4/); // balanceOfBatch selector
    });

    it("encodes balanceOfBatch with multiple accounts/ids", async () => {
      const accounts = [TEST_OWNER, TEST_RECIPIENT, TEST_OPERATOR];
      const ids = [Uint.from(1n, 256), Uint.from(2n, 256), Uint.from(3n, 256)];
      const result = await Effect.runPromise(ERC1155.encodeBalanceOfBatch(accounts, ids));
      expect(result).toMatch(/^0x4e1273f4/);
    });

    it("encodes empty arrays", async () => {
      const result = await Effect.runPromise(ERC1155.encodeBalanceOfBatch([], []));
      expect(result).toMatch(/^0x4e1273f4/);
    });
  });

  describe("decodeBalanceOfBatchResult", () => {
    it("decodes array of balances", async () => {
      // ABI-encoded array [100, 200, 300]
      const encoded = "0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000000c8000000000000000000000000000000000000000000000000000000000000012c";
      const result = await Effect.runPromise(ERC1155.decodeBalanceOfBatchResult(encoded));
      expect(result).toEqual([100n, 200n, 300n]);
    });

    it("decodes empty array", async () => {
      const encoded = "0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000";
      const result = await Effect.runPromise(ERC1155.decodeBalanceOfBatchResult(encoded));
      expect(result).toEqual([]);
    });
  });

  describe("encodeSafeBatchTransferFrom", () => {
    it("encodes batch transfer with empty data", async () => {
      const ids = [Uint.from(1n, 256), Uint.from(2n, 256)];
      const amounts = [Uint.from(10n, 256), Uint.from(20n, 256)];
      const result = await Effect.runPromise(
        ERC1155.encodeSafeBatchTransferFrom(TEST_OWNER, TEST_RECIPIENT, ids, amounts)
      );
      expect(result).toMatch(/^0x2eb2c2d6/); // safeBatchTransferFrom selector
    });

    it("encodes batch transfer with callback data", async () => {
      const ids = [Uint.from(1n, 256)];
      const amounts = [Uint.from(100n, 256)];
      const callbackData = new Uint8Array([0xca, 0xfe, 0xba, 0xbe]);
      const result = await Effect.runPromise(
        ERC1155.encodeSafeBatchTransferFrom(TEST_OWNER, TEST_RECIPIENT, ids, amounts, callbackData)
      );
      expect(result).toMatch(/^0x2eb2c2d6/);
      expect(result.toLowerCase()).toContain("cafebabe");
    });

    it("handles large batch (gas efficiency test case)", async () => {
      const ids = Array.from({ length: 50 }, (_, i) => Uint.from(BigInt(i), 256));
      const amounts = Array.from({ length: 50 }, (_, i) => Uint.from(BigInt((i + 1) * 10), 256));
      const result = await Effect.runPromise(
        ERC1155.encodeSafeBatchTransferFrom(TEST_OWNER, TEST_RECIPIENT, ids, amounts)
      );
      expect(result).toMatch(/^0x2eb2c2d6/);
    });
  });

  describe("decodeTransferBatchEvent", () => {
    it("decodes TransferBatch event", async () => {
      const log = {
        topics: [
          "0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb", // TransferBatch topic
          "0x000000000000000000000000" + TEST_OPERATOR.slice(2), // operator (indexed)
          "0x000000000000000000000000" + TEST_OWNER.slice(2), // from (indexed)
          "0x000000000000000000000000" + TEST_RECIPIENT.slice(2), // to (indexed)
        ],
        data: "0x00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000a",
      };
      const result = await Effect.runPromise(ERC1155.decodeTransferBatchEvent(log));
      expect(result.operator.toLowerCase()).toBe(TEST_OPERATOR.toLowerCase());
      expect(result.from.toLowerCase()).toBe(TEST_OWNER.toLowerCase());
      expect(result.to.toLowerCase()).toBe(TEST_RECIPIENT.toLowerCase());
      expect(result.ids).toHaveLength(1);
      expect(result.values).toHaveLength(1);
    });

    it("fails on invalid log", async () => {
      const result = await Effect.runPromiseExit(
        ERC1155.decodeTransferBatchEvent({ topics: [], data: "0x" })
      );
      expect(result._tag).toBe("Failure");
    });
  });

  describe("decodeURIEvent", () => {
    it("decodes URI event", async () => {
      const log = {
        topics: [
          "0x6bb7ff708619ba0610cba295a58592e0451dee2622938c8755667688daf3529b", // URI topic
          "0x0000000000000000000000000000000000000000000000000000000000000001", // id (indexed)
        ],
        data: "0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002568747470733a2f2f6578616d706c652e636f6d2f6d657461646174612f312e6a736f6e000000000000000000000000000000000000000000000000000000",
      };
      const result = await Effect.runPromise(ERC1155.decodeURIEvent(log));
      expect(result.id).toBe(1n);
      expect(result.value).toBe("https://example.com/metadata/1.json");
    });
  });
});
```
</test_cases>
</tests>

<docs>
```typescript
/**
 * Encodes a call to `balanceOfBatch(address[] accounts, uint256[] ids)`.
 * Gas-efficient way to query multiple token balances in a single call.
 * @param accounts - Array of owner addresses (must match ids length)
 * @param ids - Array of token IDs (must match accounts length)
 * @returns Effect yielding encoded calldata
 */
export const encodeBalanceOfBatch: (accounts: readonly AddressType[], ids: readonly Uint256Type[]) => Effect.Effect<string, StandardsError>;

/**
 * Decodes the result of a `balanceOfBatch` call.
 * @param data - ABI-encoded return data
 * @returns Effect yielding array of balances corresponding to input accounts/ids
 */
export const decodeBalanceOfBatchResult: (data: string) => Effect.Effect<readonly Uint256Type[], StandardsError>;

/**
 * Encodes a call to `safeBatchTransferFrom(address from, address to, uint256[] ids, uint256[] amounts, bytes data)`.
 * Transfers multiple token types in a single transaction for gas efficiency.
 * @param from - Current owner
 * @param to - Recipient
 * @param ids - Array of token IDs to transfer
 * @param amounts - Array of amounts to transfer (must match ids length)
 * @param data - Optional callback data for onERC1155BatchReceived
 * @returns Effect yielding encoded calldata
 */
export const encodeSafeBatchTransferFrom: (from: AddressType, to: AddressType, ids: readonly Uint256Type[], amounts: readonly Uint256Type[], data?: Uint8Array) => Effect.Effect<string, StandardsError>;

/**
 * Decodes a TransferBatch event log.
 * Emitted when multiple token types are transferred in a single transaction.
 * @param log - Event log with topics and data
 * @returns Effect yielding decoded event with operator, from, to, ids array, values array
 */
export const decodeTransferBatchEvent: (log: { topics: string[]; data: string }) => Effect.Effect<{ operator: string; from: string; to: string; ids: readonly Uint256Type[]; values: readonly Uint256Type[] }, StandardsError>;

/**
 * Decodes a URI event log.
 * Emitted when the URI for a token ID changes.
 * @param log - Event log with topics and data
 * @returns Effect yielding decoded event with new URI value and token id
 */
export const decodeURIEvent: (log: { topics: string[]; data: string }) => Effect.Effect<{ value: string; id: Uint256Type }, StandardsError>;
```
</docs>

<api>
<new_functions>
- `encodeBalanceOfBatch(accounts: readonly AddressType[], ids: readonly Uint256Type[]): Effect<string, StandardsError>`
- `decodeBalanceOfBatchResult(data: string): Effect<readonly Uint256Type[], StandardsError>`
- `encodeSafeBatchTransferFrom(from: AddressType, to: AddressType, ids: readonly Uint256Type[], amounts: readonly Uint256Type[], data?: Uint8Array): Effect<string, StandardsError>`
- `decodeTransferBatchEvent(log: { topics: string[]; data: string }): Effect<{ operator: string; from: string; to: string; ids: readonly Uint256Type[]; values: readonly Uint256Type[] }, StandardsError>`
- `decodeURIEvent(log: { topics: string[]; data: string }): Effect<{ value: string; id: Uint256Type }, StandardsError>`
</new_functions>
</api>

<references>
- [ERC-1155 Multi Token Standard](https://eips.ethereum.org/EIPS/eip-1155)
- [OpenZeppelin ERC1155](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC1155/ERC1155.sol)
- [viem multi-token support](https://github.com/wevm/viem)
</references>
</issue>
