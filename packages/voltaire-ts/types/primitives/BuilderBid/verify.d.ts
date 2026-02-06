/**
 * @typedef {import('./BuilderBidType.js').BuilderBidType} BuilderBidType
 */
/**
 * Verifies the builder's BLS signature on the bid
 *
 * @param {BuilderBidType} bid - BuilderBid instance
 * @param {object} crypto - Crypto dependencies
 * @param {(pubkey: Uint8Array, message: Uint8Array, signature: Uint8Array) => boolean} crypto.blsVerify - BLS verification function
 * @returns {boolean} True if signature is valid
 * @throws {MissingCryptoDependencyError} If blsVerify function is not provided
 * @example
 * ```typescript
 * import * as BuilderBid from './BuilderBid/index.js';
 * import { blsVerify } from './crypto/bls.js';
 * const valid = BuilderBid.verify(bid, { blsVerify });
 * console.log(`Signature valid: ${valid}`);
 * ```
 */
export function verify(bid: BuilderBidType, crypto: {
    blsVerify: (pubkey: Uint8Array, message: Uint8Array, signature: Uint8Array) => boolean;
}): boolean;
export type BuilderBidType = import("./BuilderBidType.js").BuilderBidType;
//# sourceMappingURL=verify.d.ts.map