import { GAS_PER_BLOB, MAX_PER_TRANSACTION } from "./constants.js";

/**
 * Calculate blob gas for number of blobs
 *
 * @see https://voltaire.tevm.sh/primitives/blob for Blob documentation
 * @since 0.0.0
 * @param {number} blobCount - Number of blobs
 * @returns {number} Total blob gas
 * @throws {Error} If blob count is invalid or exceeds maximum per transaction
 * @example
 * ```javascript
 * import * as Blob from './primitives/Blob/index.js';
 * const gas = Blob.calculateGas(3); // 393216
 * ```
 */
export function calculateGas(blobCount) {
	if (blobCount < 0 || blobCount > MAX_PER_TRANSACTION) {
		throw new Error(
			`Invalid blob count: ${blobCount} (max ${MAX_PER_TRANSACTION})`,
		);
	}
	return blobCount * GAS_PER_BLOB;
}
