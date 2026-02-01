/**
 * @typedef {import('./BundleHashType.js').BundleHashType} BundleHashType
 */
/**
 * Converts BundleHash to hex string
 *
 * @param {BundleHashType} hash - BundleHash instance
 * @returns {string} Hex string with 0x prefix
 * @example
 * ```typescript
 * import * as BundleHash from './BundleHash/index.js';
 * const hex = BundleHash.toHex(hash);
 * console.log(hex); // "0x1234..."
 * ```
 */
export function toHex(hash: BundleHashType): string;
export type BundleHashType = import("./BundleHashType.js").BundleHashType;
//# sourceMappingURL=toHex.d.ts.map