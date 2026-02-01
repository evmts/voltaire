/**
 * @typedef {import('./BundleHashType.js').BundleHashType} BundleHashType
 * @typedef {import('./BundleHashType.js').BundleHashLike} BundleHashLike
 */
/**
 * Creates a BundleHash from various input types
 *
 * @param {BundleHashLike} value - BundleHash input (hex string or bytes)
 * @returns {BundleHashType} BundleHash instance
 * @throws {InvalidBundleHashError} If input format is invalid
 * @example
 * ```typescript
 * import * as BundleHash from './BundleHash/index.js';
 * const hash = BundleHash.from("0x1234...");
 * ```
 */
export function from(value: BundleHashLike): BundleHashType;
export type BundleHashType = import("./BundleHashType.js").BundleHashType;
export type BundleHashLike = import("./BundleHashType.js").BundleHashLike;
//# sourceMappingURL=from.d.ts.map