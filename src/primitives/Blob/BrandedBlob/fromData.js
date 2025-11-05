import { SIZE } from "./constants.js";

/**
 * Create blob from arbitrary data (standard form)
 * Encodes data with length prefix + data + padding
 *
 * @param {Uint8Array} data - Data to encode (max ~131KB)
 * @returns {import('../BrandedBlob.js').BrandedBlob} Blob containing encoded data
 * @throws {Error} If data exceeds maximum size
 *
 * @example
 * ```javascript
 * const data = new TextEncoder().encode("Hello, blob!");
 * const blob = Blob.fromData(data);
 * ```
 */
export function fromData(data) {
	if (data.length > SIZE - 8) {
		throw new Error(`Data too large: ${data.length} bytes (max ${SIZE - 8})`);
	}

	const blob = new Uint8Array(SIZE);
	const view = new DataView(blob.buffer);

	// Length prefix (8 bytes, little-endian)
	view.setBigUint64(0, BigInt(data.length), true);

	// Copy data
	blob.set(data, 8);

	return /** @type {import('../BrandedBlob.js').BrandedBlob} */ (blob);
}
