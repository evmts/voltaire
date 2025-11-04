// @ts-nocheck
import * as Eip4844 from "./eip4844Constants.js";
import { fakeExponential } from "./fakeExponential.js";

/**
 * Calculate blob base fee using EIP-4844 formula (standard form)
 *
 * Formula: fakeExponential(MIN_BLOB_BASE_FEE, excessBlobGas, BLOB_BASE_FEE_UPDATE_FRACTION)
 *
 * Uses Taylor series to approximate: MIN_BLOB_BASE_FEE * e^(excessBlobGas / UPDATE_FRACTION)
 *
 * @param {bigint} excessBlobGas - Excess blob gas from previous blocks
 * @returns {bigint} Blob base fee (wei per blob gas)
 *
 * @example
 * ```typescript
 * // No excess: minimum fee
 * const fee1 = calculateBlobBaseFee(0n);
 * // fee1 === 1n
 *
 * // At target: fee increases
 * const fee2 = calculateBlobBaseFee(393216n);
 * // fee2 > 1n
 *
 * // High excess: exponentially higher fee
 * const fee3 = calculateBlobBaseFee(1_000_000n);
 * // fee3 >> fee2
 * ```
 */
export function calculateBlobBaseFee(excessBlobGas) {
	return fakeExponential(
		Eip4844.MIN_BLOB_BASE_FEE,
		excessBlobGas,
		Eip4844.BLOB_BASE_FEE_UPDATE_FRACTION,
	);
}
