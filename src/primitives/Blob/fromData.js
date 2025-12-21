import { SIZE } from "./constants.js";

/**
 * Create blob from arbitrary data using length-prefix encoding.
 * Format: 8-byte little-endian length prefix + data + zero padding
 *
 * @see https://voltaire.tevm.sh/primitives/blob for Blob documentation
 * @since 0.0.0
 * @param {Uint8Array} data - Data to encode (max SIZE - 8 bytes)
 * @returns {import('../BrandedBlob.js').BrandedBlob} Blob containing encoded data
 * @throws {Error} If data exceeds maximum size
 * @example
 * ```javascript
 * import * as Blob from './primitives/Blob/index.js';
 * const data = new TextEncoder().encode("Hello, blob!");
 * const blob = Blob.fromData(data);
 * ```
 */
export function fromData(data) {
	const maxDataSize = SIZE - 8; // 8 bytes for length prefix

	if (data.length > maxDataSize) {
		throw new Error(
			`Data too large: ${data.length} bytes (max ${maxDataSize})`,
		);
	}

	const blob = new Uint8Array(SIZE);

	// Write 8-byte little-endian length prefix
	const view = new DataView(blob.buffer, blob.byteOffset, blob.byteLength);
	view.setBigUint64(0, BigInt(data.length), true);

	// Copy data after length prefix
	blob.set(data, 8);

	// Rest is already zero-padded from Uint8Array construction

	return /** @type {import('../BrandedBlob.js').BrandedBlob} */ (blob);
}
