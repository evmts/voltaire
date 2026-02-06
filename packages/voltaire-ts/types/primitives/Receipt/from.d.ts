/**
 * Create Receipt from partial data
 *
 * @see https://voltaire.tevm.sh/primitives/receipt for Receipt documentation
 * @since 0.0.0
 * @param {Omit<import('./ReceiptType.js').ReceiptType, typeof import('../../brand.js').brand>} data
 * @returns {import('./ReceiptType.js').ReceiptType}
 * @throws {InvalidReceiptError} If required field is missing
 * @throws {InvalidReceiptLengthError} If logsBloom has wrong length
 * @example
 * ```javascript
 * import * as Receipt from './primitives/Receipt/index.js';
 * const receipt = Receipt.from({
 *   transactionHash: txHash,
 *   transactionIndex: 0,
 *   blockHash: blockHash,
 *   // ... other fields
 * });
 * ```
 */
export function from(data: Omit<import("./ReceiptType.js").ReceiptType, typeof import("../../brand.js").brand>): import("./ReceiptType.js").ReceiptType;
//# sourceMappingURL=from.d.ts.map