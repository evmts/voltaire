/**
 * @typedef {import('./BundleType.js').BundleType} BundleType
 */
/**
 * Adds a transaction to the bundle
 *
 * @param {BundleType} bundle - Bundle instance
 * @param {Uint8Array | string} transaction - Signed transaction to add
 * @returns {BundleType} New bundle with added transaction
 * @throws {InvalidBundleError} If transaction format is invalid
 * @example
 * ```typescript
 * import * as Bundle from './Bundle/index.js';
 * const newBundle = Bundle.addTransaction(bundle, signedTx);
 * ```
 */
export function addTransaction(bundle: BundleType, transaction: Uint8Array | string): BundleType;
export type BundleType = import("./BundleType.js").BundleType;
//# sourceMappingURL=addTransaction.d.ts.map