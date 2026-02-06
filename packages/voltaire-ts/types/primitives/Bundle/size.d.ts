/**
 * @typedef {import('./BundleType.js').BundleType} BundleType
 */
/**
 * Returns the number of transactions in the bundle
 *
 * @param {BundleType} bundle - Bundle instance
 * @returns {number} Number of transactions
 * @example
 * ```typescript
 * import * as Bundle from './Bundle/index.js';
 * const count = Bundle.size(bundle);
 * console.log(`Bundle contains ${count} transactions`);
 * ```
 */
export function size(bundle: BundleType): number;
export type BundleType = import("./BundleType.js").BundleType;
//# sourceMappingURL=size.d.ts.map