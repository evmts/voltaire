import { SIZE } from "./constants.js";

/**
 * Estimate number of blobs needed for data
 *
 * @see https://voltaire.tevm.sh/primitives/blob for Blob documentation
 * @since 0.0.0
 * @param {number} dataSize - Size of data in bytes
 * @returns {number} Number of blobs required
 * @throws {Error} If data size is negative
 * @example
 * ```javascript
 * import * as Blob from './primitives/Blob/index.js';
 * const blobCount = Blob.estimateBlobCount(200000); // 2
 * ```
 */
export function estimateBlobCount(dataSize) {
	if (dataSize < 0) {
		throw new Error(`Invalid data size: ${dataSize}`);
	}
	const maxDataPerBlob = SIZE - 8; // Account for length prefix
	return Math.ceil(dataSize / maxDataPerBlob);
}
