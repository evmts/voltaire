/**
 * Create an EIP-7732 (ePBS) `SignedExecutionPayloadBid`.
 *
 * Normalizes the bid with `from` and checks that the signature is 96 bytes.
 * It does not verify the BLS signature.
 *
 * @see https://eips.ethereum.org/EIPS/eip-7732
 * @param {import('./ExecutionPayloadBidType.js').SignedExecutionPayloadBidLike} signed
 * @returns {import('./ExecutionPayloadBidType.js').SignedExecutionPayloadBidType}
 * @throws {InvalidExecutionPayloadBidError} If the bid or signature is malformed
 * @example
 * ```javascript
 * import { ExecutionPayloadBid } from "@tevm/voltaire";
 *
 * const signed = ExecutionPayloadBid.fromSigned({
 *   message: bid,
 *   signature: `0x${"00".repeat(96)}`,
 * });
 * ```
 */
export function fromSigned(signed: import("./ExecutionPayloadBidType.js").SignedExecutionPayloadBidLike): import("./ExecutionPayloadBidType.js").SignedExecutionPayloadBidType;
//# sourceMappingURL=fromSigned.d.ts.map