/**
 * @typedef {import('./BuilderBidType.js').BuilderBidType} BuilderBidType
 */
/**
 * Gets the bid value in wei
 *
 * @param {BuilderBidType} bid - BuilderBid instance
 * @returns {bigint} Bid value in wei
 * @example
 * ```typescript
 * import * as BuilderBid from './BuilderBid/index.js';
 * const value = BuilderBid.getValue(bid);
 * console.log(`Bid: ${value} wei`);
 * ```
 */
export function getValue(bid: BuilderBidType): bigint;
export type BuilderBidType = import("./BuilderBidType.js").BuilderBidType;
//# sourceMappingURL=getValue.d.ts.map