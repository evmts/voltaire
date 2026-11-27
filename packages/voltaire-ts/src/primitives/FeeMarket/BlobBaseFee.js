import { calculateBlobBaseFee } from "./calculateBlobBaseFee.js";

/**
 * Calculate blob base fee using EIP-4844 / EIP-7691 / EIP-7892 formula (constructor form)
 *
 * Formula: `fakeExponential(MIN_BLOB_BASE_FEE, excessBlobGas, baseFeeUpdateFraction)`
 *
 * @see https://voltaire.tevm.sh/primitives/feemarket for FeeMarket documentation
 * @since 0.0.0
 * @param {bigint} excessBlobGas - Excess blob gas from previous blocks
 * @param {bigint | import('./BlobScheduleType.js').BlobScheduleType} [updateFractionOrSchedule] - Optional update fraction or BlobSchedule (defaults to Cancun 3338477n)
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
export function BlobBaseFee(excessBlobGas, updateFractionOrSchedule) {
	return calculateBlobBaseFee(excessBlobGas, updateFractionOrSchedule);
}
