/**
 * @typedef {import('./BundleHashType.js').BundleHashType} BundleHashType
 */
/**
 * Creates BundleHash from hex string
 *
 * @param {string} value - Hex string (with or without 0x prefix)
 * @returns {BundleHashType} BundleHash instance
 * @throws {InvalidBundleHashError} If hex format is invalid
 * @example
 * ```typescript
 * import * as BundleHash from './BundleHash/index.js';
 * const hash = BundleHash.fromHex("0x1234...");
 * ```
 */
export function fromHex(value: string): BundleHashType;
export type BundleHashType = import("./BundleHashType.js").BundleHashType;
//# sourceMappingURL=fromHex.d.ts.map