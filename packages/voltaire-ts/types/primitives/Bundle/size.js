// @ts-nocheck
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
export function size(bundle) {
    return bundle.transactions.length;
}
