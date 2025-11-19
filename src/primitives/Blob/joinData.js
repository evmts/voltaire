import { toData } from "./toData.js";

/**
 * Join multiple blobs into single data buffer
 *
 * @see https://voltaire.tevm.sh/primitives/blob for Blob documentation
 * @since 0.0.0
 * @param {readonly import('../BrandedBlob.js').BrandedBlob[]} blobs - Array of blobs to join
 * @returns {Uint8Array} Combined data
 * @throws {Error} If blob size or length prefix is invalid
 * @example
 * ```javascript
 * import * as Blob from './primitives/Blob/index.js';
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
