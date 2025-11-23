import {
	BYTES_PER_FIELD_ELEMENT,
	FIELD_ELEMENTS_PER_BLOB,
} from "./constants.js";

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
	// Each field element holds 31 bytes of data (1 byte reserved for 0x00)
	const maxDataPerBlob =
		FIELD_ELEMENTS_PER_BLOB * (BYTES_PER_FIELD_ELEMENT - 1);
	return Math.ceil(dataSize / maxDataPerBlob);
}
