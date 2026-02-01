/**
 * Creates a BuilderBid from various input types
 *
 * @param {BuilderBidLike} value - BuilderBid input
 * @returns {BuilderBidType} BuilderBid instance
 * @throws {InvalidBuilderBidError} If bid format is invalid
 * @example
 * ```typescript
 * import * as BuilderBid from './BuilderBid/index.js';
 * const bid = BuilderBid.from({
 *   slot: 123456n,
 *   parentHash: "0x...",
 *   blockHash: "0x...",
 *   builderPubkey: builderKey,
 *   proposerPubkey: proposerKey,
 *   proposerFeeRecipient: feeRecipient,
 *   gasLimit: 30000000n,
 *   gasUsed: 25000000n,
 *   value: 1000000000000000000n,
 *   signature: signature,
 * });
 * ```
 */
export function from(value: BuilderBidLike): BuilderBidType;
export type BuilderBidType = import("./BuilderBidType.js").BuilderBidType;
export type BuilderBidLike = import("./BuilderBidType.js").BuilderBidLike;
//# sourceMappingURL=from.d.ts.map