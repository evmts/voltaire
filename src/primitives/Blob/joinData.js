import { toData } from "./toData.js";

/**
 * Join multiple blobs into single data buffer
 *
 * @param {readonly import('./BrandedBlob.js').BrandedBlob[]} blobs - Array of blobs to join
 * @returns {Uint8Array} Combined data
 *
 * @example
 * ```javascript
 * const blobs = Blob.splitData(largeData);
 * const reconstructed = Blob.joinData(blobs);
 * ```
 */
export function joinData(blobs) {
	const chunks = blobs.map((b) => toData(b));
	const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);

	const result = new Uint8Array(totalLength);
	let offset = 0;
	for (const chunk of chunks) {
		result.set(chunk, offset);
		offset += chunk.length;
	}

	return result;
}
