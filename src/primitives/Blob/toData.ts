import type { BrandedBlob } from "./BrandedBlob.js";
import { SIZE } from "./constants.js";

/**
 * Extract data from blob
 * Decodes blob format (reads length prefix and extracts data)
 *
 * @param blob - Blob data
 * @returns Original data
 * @throws If blob size or length prefix is invalid
 *
 * @example
 * ```typescript
 * const data = Blob.toData(blob);
 * const text = new TextDecoder().decode(data);
 * ```
 */
export function toData(blob: BrandedBlob): Uint8Array {
	if (blob.length !== SIZE) {
		throw new Error(`Invalid blob size: ${blob.length} (expected ${SIZE})`);
	}

	const view = new DataView(blob.buffer, blob.byteOffset, blob.byteLength);
	const length = Number(view.getBigUint64(0, true));

	if (length > SIZE - 8) {
		throw new Error(`Invalid length prefix: ${length}`);
	}

	return blob.slice(8, 8 + length);
}
