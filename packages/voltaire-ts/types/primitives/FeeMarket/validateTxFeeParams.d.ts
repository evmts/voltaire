/**
 * Validate transaction fee parameters
 *
 * @see https://voltaire.tevm.sh/primitives/feemarket for FeeMarket documentation
 * @since 0.0.0
 * @param {import('../TxFeeParams.js').TxFeeParams | import('../BlobTxFeeParams.js').BlobTxFeeParams} params - Transaction fee parameters
 * @returns {string[]} Validation errors, empty array if valid
 * @throws {never}
 * @example
 * ```javascript
 * import * as FeeMarket from './primitives/FeeMarket/index.js';
 * const errors = FeeMarket.validateTxFeeParams({
 *   maxFeePerGas: 2000000000n,
 *   maxPriorityFeePerGas: 1000000000n,
 *   baseFee: 800000000n
 * });
 * ```
 */
export function validateTxFeeParams(params: any | any): string[];
//# sourceMappingURL=validateTxFeeParams.d.ts.map