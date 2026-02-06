/**
 * @typedef {import('./BundleHashType.js').BundleHashType} BundleHashType
 */
/**
 * Checks if two BundleHashes are equal
 *
 * @param {BundleHashType} a - First hash
 * @param {BundleHashType} b - Second hash
 * @returns {boolean} True if hashes are equal
 * @example
 * ```typescript
 * import * as BundleHash from './BundleHash/index.js';
 * const equal = BundleHash.equals(hash1, hash2);
 * ```
 */
export function equals(a: BundleHashType, b: BundleHashType): boolean;
export type BundleHashType = import("./BundleHashType.js").BundleHashType;
//# sourceMappingURL=equals.d.ts.map