/**
 * Check if transaction can be included in block (standard form)
 *
 * Transaction is valid if:
 * - maxFeePerGas >= baseFee
 * - For blob txs: maxFeePerBlobGas >= blobBaseFee
 *
 * @see https://voltaire.tevm.sh/primitives/feemarket for FeeMarket documentation
 * @since 0.0.0
 * @param {import('../TxFeeParams.js').TxFeeParams | import('../BlobTxFeeParams.js').BlobTxFeeParams} params - Transaction fee parameters
 * @returns {boolean} true if transaction meets minimum fee requirements
 * @throws {never}
 * @example
 * ```javascript
 * import * as FeeMarket from './primitives/FeeMarket/index.js';
 * const canInclude = FeeMarket.canIncludeTx({
 *   maxFeePerGas: 1_000_000_000n,
 *   maxPriorityFeePerGas: 100_000_000n,
 *   baseFee: 900_000_000n
 * });
 * ```
 */
export function canIncludeTx(params: any | any): boolean;
//# sourceMappingURL=canIncludeTx.d.ts.map