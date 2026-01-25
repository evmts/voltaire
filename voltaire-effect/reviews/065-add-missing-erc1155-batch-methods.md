# Add Missing ERC1155 Batch Methods

## Problem

ERC1155 module is missing batch operation encoders and event decoders.

**Location**: `src/standards/ERC1155.ts`

Missing:
- `encodeBalanceOfBatch(accounts[], ids[])`
- `encodeSafeBatchTransferFrom(...)`
- `decodeTransferBatchEvent(log)`
- `decodeURIEvent(log)`

## Why This Matters

- Batch operations are core ERC-1155 functionality
- Gas-efficient batch queries not available
- Event decoding incomplete
- Users must implement manually

## Solution

Add missing batch methods:

```typescript
/**
 * Encodes a call to `balanceOfBatch(address[] accounts, uint256[] ids)`.
 * @param accounts - Array of owner addresses
 * @param ids - Array of token IDs (same length as accounts)
 * @returns Encoded calldata
 */
export const encodeBalanceOfBatch = (
  accounts: readonly Address[],
  ids: readonly bigint[],
): Hex =>
  Abi.encodeFunction(ERC1155_ABI, "balanceOfBatch", [accounts, ids]);

/**
 * Decodes result from `balanceOfBatch`.
 * @param data - Encoded return data
 * @returns Array of balances
 */
export const decodeBalanceOfBatchResult = (data: Hex): readonly bigint[] =>
  Abi.decodeFunctionResult(ERC1155_ABI, "balanceOfBatch", data) as bigint[];

/**
 * Encodes a call to `safeBatchTransferFrom(...)`.
 * @param from - Current owner
 * @param to - Recipient
 * @param ids - Array of token IDs
 * @param amounts - Array of amounts (same length as ids)
 * @param data - Additional data for onERC1155BatchReceived
 * @returns Encoded calldata
 */
export const encodeSafeBatchTransferFrom = (
  from: Address,
  to: Address,
  ids: readonly bigint[],
  amounts: readonly bigint[],
  data: Hex,
): Hex =>
  Abi.encodeFunction(ERC1155_ABI, "safeBatchTransferFrom", [
    from,
    to,
    ids,
    amounts,
    data,
  ]);

/**
 * Decodes a TransferBatch event log.
 * @param log - Event log with topics and data
 * @returns Decoded event parameters
 */
export const decodeTransferBatchEvent = (log: EventLog): {
  operator: Address;
  from: Address;
  to: Address;
  ids: readonly bigint[];
  values: readonly bigint[];
} =>
  Abi.decodeEventLog(ERC1155_ABI, "TransferBatch", log) as any;

/**
 * Decodes a URI event log.
 * @param log - Event log with topics and data
 * @returns Decoded event parameters
 */
export const decodeURIEvent = (log: EventLog): {
  value: string;
  id: bigint;
} =>
  Abi.decodeEventLog(ERC1155_ABI, "URI", log) as any;
```

## Acceptance Criteria

- [ ] Add `encodeBalanceOfBatch`
- [ ] Add `decodeBalanceOfBatchResult`
- [ ] Add `encodeSafeBatchTransferFrom`
- [ ] Add `decodeTransferBatchEvent`
- [ ] Add `decodeURIEvent`
- [ ] Add tests for each
- [ ] Export from index

## Priority

**Low** - API completeness
