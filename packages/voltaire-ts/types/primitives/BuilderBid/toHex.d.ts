/**
 * Converts BuilderBid to hex representation (RPC format)
 *
 * @param {BuilderBidType} bid - BuilderBid instance
 * @returns {BuilderBidHex} BuilderBid with hex strings
 * @example
 * ```typescript
 * import * as BuilderBid from './BuilderBid/index.js';
 * const hexBid = BuilderBid.toHex(bid);
 * ```
 */
export function toHex(bid: BuilderBidType): BuilderBidHex;
export type BuilderBidType = import("./BuilderBidType.js").BuilderBidType;
export type BuilderBidHex = import("./BuilderBidType.js").BuilderBidHex;
//# sourceMappingURL=toHex.d.ts.map