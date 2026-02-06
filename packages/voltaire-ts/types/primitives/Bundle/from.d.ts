/**
 * @typedef {import('./BundleType.js').BundleType} BundleType
 * @typedef {import('./BundleType.js').BundleLike} BundleLike
 */
/**
 * Creates a Bundle from various input types
 *
 * @param {BundleLike} value - Bundle input
 * @returns {BundleType} Bundle instance
 * @throws {InvalidBundleError} If bundle format is invalid
 * @example
 * ```typescript
 * import * as Bundle from './Bundle/index.js';
 * const bundle = Bundle.from({
 *   transactions: [tx1, tx2],
 *   blockNumber: 123456n,
 * });
 * ```
 */
export function from(value: BundleLike): BundleType;
export type BundleType = import("./BundleType.js").BundleType;
export type BundleLike = import("./BundleType.js").BundleLike;
//# sourceMappingURL=from.d.ts.map