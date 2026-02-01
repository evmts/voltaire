/**
 * Calculate blob base fee using EIP-4844 formula (constructor form)
 *
 * Formula: fakeExponential(MIN_BLOB_BASE_FEE, excessBlobGas, BLOB_BASE_FEE_UPDATE_FRACTION)
 *
 * Uses Taylor series to approximate: MIN_BLOB_BASE_FEE * e^(excessBlobGas / UPDATE_FRACTION)
 *
 * @see https://voltaire.tevm.sh/primitives/feemarket for FeeMarket documentation
 * @since 0.0.0
 * @param {bigint} excessBlobGas - Excess blob gas from previous blocks
 * @returns {bigint} Blob base fee (wei per blob gas)
 * @throws {never}
 * @example
 * ```javascript
 * import * as FeeMarket from './primitives/FeeMarket/index.js';
 * // No excess: minimum fee
 * const fee1 = FeeMarket.BlobBaseFee(0n);
 * // fee1 === 1n
 * ```
 */
export function BlobBaseFee(excessBlobGas: bigint): bigint;
//# sourceMappingURL=BlobBaseFee.d.ts.map