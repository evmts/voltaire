/**
 * @typedef {import('./BundleType.js').BundleType} BundleType
 * @typedef {import('../Hash/HashType.js').HashType} HashType
 */
/**
 * Computes the bundle hash (keccak256 of bundle contents)
 *
 * @param {BundleType} bundle - Bundle instance
 * @param {object} crypto - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} crypto.keccak256 - Keccak256 function
 * @returns {HashType} Bundle hash
 * @throws {MissingCryptoDependencyError} If keccak256 function is not provided
 * @example
 * ```typescript
 * import * as Bundle from './Bundle/index.js';
 * import { keccak256 } from './crypto/keccak256.js';
 * const hash = Bundle.toHash(bundle, { keccak256 });
 * ```
 */
export function toHash(bundle: BundleType, crypto: {
    keccak256: (data: Uint8Array) => Uint8Array;
}): HashType;
export type BundleType = import("./BundleType.js").BundleType;
export type HashType = import("../Hash/HashType.js").HashType;
//# sourceMappingURL=toHash.d.ts.map