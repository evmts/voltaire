// @ts-nocheck
import * as Eip4844 from "../eip4844Constants.js";
import { calculateTxFee } from "./calculateTxFee.js";

/**
 * Calculate blob transaction fee (standard form)
 *
 * Combines regular gas fee with blob gas fee.
 *
 * @see https://voltaire.tevm.sh/primitives/feemarket for FeeMarket documentation
 * @since 0.0.0
 * @param {import('../BlobTxFeeParams.js').BlobTxFeeParams} params - Blob transaction fee parameters
 * @returns {import('../BlobTxFee.js').BlobTxFee} Calculated fee breakdown including blob fees
 * @throws {never}
 * @example
 * ```javascript
 * import * as FeeMarket from './primitives/FeeMarket/index.js';
 * const fee = FeeMarket.calculateBlobTxFee({
 *   maxFeePerGas: 2_000_000_000n,
 *   maxPriorityFeePerGas: 1_000_000_000n,
 *   baseFee: 800_000_000n,
 *   maxFeePerBlobGas: 10_000_000n,
 *   blobBaseFee: 5_000_000n,
 *   blobCount: 3n
 * });
 * ```
 */
export function calculateBlobTxFee(params) {
	const { maxFeePerBlobGas, blobBaseFee, blobCount } = params;

	// Calculate regular gas fee
	const txFee = calculateTxFee(params);

	// Blob gas price is capped by maxFeePerBlobGas
	const blobGasPrice =
		blobBaseFee < maxFeePerBlobGas ? blobBaseFee : maxFeePerBlobGas;

	// Total blob fee = blobGasPrice * gasPerBlob * blobCount
	const totalBlobFee = blobGasPrice * Eip4844.BLOB_GAS_PER_BLOB * blobCount;

	return {
		...txFee,
		blobGasPrice,
		totalBlobFee,
	};
}
