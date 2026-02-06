import {
	BYTES_PER_FIELD_ELEMENT,
	FIELD_ELEMENTS_PER_BLOB,
	MAX_PER_TRANSACTION,
} from "./constants.js";
import { InvalidBlobDataSizeError } from "./errors.js";
import { estimateBlobCount } from "./estimateBlobCount.js";
import { fromData } from "./fromData.js";

/**
 * Split large data into multiple blobs
 *
 * @see https://voltaire.tevm.sh/primitives/blob for Blob documentation
 * @since 0.0.0
 * @param {Uint8Array} data - Data to split
 * @returns {import('./BlobType.js').BrandedBlob[]} Array of blobs containing the data
 * @throws {InvalidBlobDataSizeError} If data requires more blobs than maximum per transaction
 * @example
 * ```javascript
 * import * as Blob from './primitives/Blob/index.js';
 * const largeData = new Uint8Array(300000);
 * const blobs = Blob.splitData(largeData); // [blob1, blob2, blob3]
 * ```
 */
export function splitData(data) {
	// Max data per blob: 31 bytes per field element - 4 bytes for length prefix
	const maxDataPerBlob =
		FIELD_ELEMENTS_PER_BLOB * (BYTES_PER_FIELD_ELEMENT - 1) - 4;
	const blobCount = estimateBlobCount(data.length);

	if (blobCount > MAX_PER_TRANSACTION) {
		throw new InvalidBlobDataSizeError(
			`Data too large: requires ${blobCount} blobs (max ${MAX_PER_TRANSACTION})`,
			{
				value: data.length,
				expected: `max ${maxDataPerBlob * MAX_PER_TRANSACTION} bytes`,
			},
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
