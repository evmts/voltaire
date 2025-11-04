// @ts-nocheck
import * as Eip4844 from "./eip4844Constants.js";

/**
 * Calculate excess blob gas for next block using EIP-4844 formula (standard form)
 *
 * Formula: max(0, parentExcessBlobGas + parentBlobGasUsed - TARGET_BLOB_GAS_PER_BLOCK)
 *
 * @param {bigint} parentExcessBlobGas - Excess blob gas from parent block
 * @param {bigint} parentBlobGasUsed - Blob gas used in parent block
 * @returns {bigint} Excess blob gas for next block
 *
 * @example
 * ```typescript
 * // Below target: no excess
 * const excess1 = calculateExcessBlobGas(0n, 131072n); // 1 blob
 * // excess1 === 0n
 *
 * // At target: no new excess
 * const excess2 = calculateExcessBlobGas(0n, 393216n); // 3 blobs
 * // excess2 === 0n
 *
 * // Above target: accumulate excess
 * const excess3 = calculateExcessBlobGas(0n, 786432n); // 6 blobs
 * // excess3 === 393216n (3 blobs worth)
 * ```
 */
export function calculateExcessBlobGas(parentExcessBlobGas, parentBlobGasUsed) {
	const total = parentExcessBlobGas + parentBlobGasUsed;

	if (total < Eip4844.TARGET_BLOB_GAS_PER_BLOCK) {
		return 0n;
	}

	return total - Eip4844.TARGET_BLOB_GAS_PER_BLOCK;
}
