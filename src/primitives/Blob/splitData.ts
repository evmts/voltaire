import type { BrandedBlob } from "./BrandedBlob.js";
import { SIZE, MAX_PER_TRANSACTION } from "./constants.js";
import { fromData } from "./fromData.js";
import { estimateBlobCount } from "./estimateBlobCount.js";

/**
 * Split large data into multiple blobs
 *
 * @param data - Data to split
 * @returns Array of blobs containing the data
 *
 * @example
 * ```typescript
 * const largeData = new Uint8Array(300000);
 * const blobs = Blob.splitData(largeData); // [blob1, blob2, blob3]
 * ```
 */
export function splitData(data: Uint8Array): BrandedBlob[] {
	const maxDataPerBlob = SIZE - 8;
	const blobCount = estimateBlobCount(data.length);

	if (blobCount > MAX_PER_TRANSACTION) {
		throw new Error(
			`Data too large: requires ${blobCount} blobs (max ${MAX_PER_TRANSACTION})`,
		);
	}

	const blobs: BrandedBlob[] = [];
	for (let i = 0; i < blobCount; i++) {
		const start = i * maxDataPerBlob;
		const end = Math.min(start + maxDataPerBlob, data.length);
		const chunk = data.slice(start, end);
		blobs.push(fromData(chunk));
	}

	return blobs;
}
