// @ts-nocheck
import * as Eip4844 from "../eip4844Constants.js";
import { fakeExponential } from "./fakeExponential.js";

/**
 * Calculate blob base fee using EIP-4844 formula (standard form)
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
 * const fee1 = FeeMarket.calculateBlobBaseFee(0n);
 * // fee1 === 1n
 * ```
 */
export function calculateBlobBaseFee(excessBlobGas) {
	return fakeExponential(
		Eip4844.MIN_BLOB_BASE_FEE,
		excessBlobGas,
		Eip4844.BLOB_BASE_FEE_UPDATE_FRACTION,
	);
}
