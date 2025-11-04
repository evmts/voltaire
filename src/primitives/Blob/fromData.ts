import type { BrandedBlob } from "./BrandedBlob.js";
import { SIZE } from "./constants.js";

/**
 * Create blob from arbitrary data (standard form)
 * Encodes data with length prefix + data + padding
 *
 * @param data - Data to encode (max ~131KB)
 * @returns Blob containing encoded data
 * @throws If data exceeds maximum size
 *
 * @example
 * ```typescript
 * const data = new TextEncoder().encode("Hello, blob!");
 * const blob = Blob.fromData(data);
 * ```
 */
export function fromData(data: Uint8Array): BrandedBlob {
	if (data.length > SIZE - 8) {
		throw new Error(`Data too large: ${data.length} bytes (max ${SIZE - 8})`);
	}

	const blob = new Uint8Array(SIZE);
	const view = new DataView(blob.buffer);

	// Length prefix (8 bytes, little-endian)
	view.setBigUint64(0, BigInt(data.length), true);

	// Copy data
	blob.set(data, 8);

	return blob as BrandedBlob;
}
