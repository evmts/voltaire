import type { BrandedBlob } from "./BrandedBlob.js";
import { toData } from "./toData.js";

/**
 * Join multiple blobs into single data buffer
 *
 * @param blobs - Array of blobs to join
 * @returns Combined data
 *
 * @example
 * ```typescript
 * const blobs = Blob.splitData(largeData);
 * const reconstructed = Blob.joinData(blobs);
 * ```
 */
export function joinData(blobs: readonly BrandedBlob[]): Uint8Array {
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
