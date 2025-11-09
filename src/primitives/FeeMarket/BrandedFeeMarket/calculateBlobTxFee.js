// @ts-nocheck
import * as Eip4844 from "../eip4844Constants.js";
import { calculateTxFee } from "./calculateTxFee.js";

/**
 * Calculate blob transaction fee (standard form)
 *
 * Combines regular gas fee with blob gas fee.
 *
 * @param {import('../BlobTxFeeParams.js').BlobTxFeeParams} params - Blob transaction fee parameters
 * @returns {import('../BlobTxFee.js').BlobTxFee} Calculated fee breakdown including blob fees
 *
 * @example
 * ```typescript
 * const fee = calculateBlobTxFee({
 *   maxFeePerGas: 2_000_000_000n,
 *   maxPriorityFeePerGas: 1_000_000_000n,
 *   baseFee: 800_000_000n,
 *   maxFeePerBlobGas: 10_000_000n, // 10 wei per blob gas
 *   blobBaseFee: 5_000_000n, // 5 wei per blob gas
 *   blobCount: 3n
 * });
 * // fee.blobGasPrice === 5_000_000n
 * // fee.totalBlobFee === 1_966_080_000_000n (3 blobs * 131072 gas/blob * 5 wei)
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
