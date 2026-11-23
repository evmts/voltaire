/**
 * Create an EIP-7732 (ePBS) `ExecutionPayloadBid`.
 *
 * Normalizes hex strings to bytes and quantities to bigint, and checks every
 * field's length or uint64 range. It does not verify the bid against a
 * payload or a signature.
 *
 * @see https://eips.ethereum.org/EIPS/eip-7732
 * @param {import('./ExecutionPayloadBidType.js').ExecutionPayloadBidLike} bid
 * @returns {import('./ExecutionPayloadBidType.js').ExecutionPayloadBidType}
 * @throws {InvalidExecutionPayloadBidError} If a field is missing, the wrong length, or out of range
 * @example
 * ```javascript
 * import { ExecutionPayloadBid } from "@tevm/voltaire";
 *
 * const zero32 = `0x${"00".repeat(32)}`;
 * const bid = ExecutionPayloadBid.from({
 *   parentBlockHash: zero32,
 *   parentBlockRoot: zero32,
 *   blockHash: zero32,
 *   prevRandao: zero32,
 *   feeRecipient: `0x${"00".repeat(20)}`,
 *   gasLimit: 60000000n,
 *   builderIndex: 7n,
 *   slot: 13164544n,
 *   value: 1000000000n,
 *   executionPayment: 0n,
 *   blobKzgCommitments: [],
 *   executionRequestsRoot: zero32,
 * });
 * ```
 */
export function from(bid: import("./ExecutionPayloadBidType.js").ExecutionPayloadBidLike): import("./ExecutionPayloadBidType.js").ExecutionPayloadBidType;
//# sourceMappingURL=from.d.ts.map