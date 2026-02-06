/**
 * @typedef {import('./BundleHashType.js').BundleHashType} BundleHashType
 * @typedef {import('../Bundle/BundleType.js').BundleType} BundleType
 */
/**
 * Computes BundleHash from a Bundle
 *
 * @param {BundleType} bundle - Bundle instance
 * @param {object} crypto - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} crypto.keccak256 - Keccak256 function
 * @returns {BundleHashType} Bundle hash
 * @throws {MissingCryptoDependencyError} If keccak256 function is not provided
 * @example
 * ```typescript
 * import * as BundleHash from './BundleHash/index.js';
 * import { keccak256 } from './crypto/keccak256.js';
 * const hash = BundleHash.fromBundle(bundle, { keccak256 });
 * ```
 */
export function fromBundle(bundle: BundleType, crypto: {
    keccak256: (data: Uint8Array) => Uint8Array;
}): BundleHashType;
export type BundleHashType = import("./BundleHashType.js").BundleHashType;
export type BundleType = import("../Bundle/BundleType.js").BundleType;
//# sourceMappingURL=fromBundle.d.ts.map