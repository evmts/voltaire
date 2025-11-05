import { MAX_PER_TRANSACTION, SIZE } from "./constants.js";
import { estimateBlobCount } from "./estimateBlobCount.js";
import { fromData } from "./fromData.js";

/**
 * Split large data into multiple blobs
 *
 * @param {Uint8Array} data - Data to split
 * @returns {import('./BrandedBlob.js').BrandedBlob[]} Array of blobs containing the data
 *
 * @example
 * ```javascript
 * const largeData = new Uint8Array(300000);
 * const blobs = Blob.splitData(largeData); // [blob1, blob2, blob3]
 * ```
 */
export function splitData(data) {
	const maxDataPerBlob = SIZE - 8;
	const blobCount = estimateBlobCount(data.length);

	if (blobCount > MAX_PER_TRANSACTION) {
		throw new Error(
			`Data too large: requires ${blobCount} blobs (max ${MAX_PER_TRANSACTION})`,
		);
	}

	const blobs = [];
	for (let i = 0; i < blobCount; i++) {
		const start = i * maxDataPerBlob;
		const end = Math.min(start + maxDataPerBlob, data.length);
		const chunk = data.slice(start, end);
		blobs.push(fromData(chunk));
	}

	return blobs;
}
