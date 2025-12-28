import {
	BYTES_PER_FIELD_ELEMENT,
	FIELD_ELEMENTS_PER_BLOB,
	SIZE,
} from "./constants.js";

/**
 * Create blob from arbitrary data using EIP-4844 field element encoding.
 * Format: Each 32-byte field element has byte[0] = 0x00 (BLS field constraint)
 * The first 4 bytes of data space (field 0, bytes 1-4) store the length prefix.
 * Remaining data bytes fill bytes 5-31 of field 0, then bytes 1-31 of subsequent fields.
 *
 * @see https://voltaire.tevm.sh/primitives/blob for Blob documentation
 * @see https://eips.ethereum.org/EIPS/eip-4844 for EIP-4844 specification
 * @since 0.0.0
 * @param {Uint8Array} data - Data to encode (max 126972 bytes)
 * @returns {import('./BlobType.js').BrandedBlob} Blob containing encoded data
 * @throws {Error} If data exceeds maximum size
 * @example
 * ```javascript
 * import * as Blob from './primitives/Blob/index.js';
 * const data = new TextEncoder().encode("Hello, blob!");
 * const blob = Blob.fromData(data);
 * ```
 */
export function fromData(data) {
	// Max data bytes: 31 bytes per field element - 4 bytes for length prefix
	// = 4096 * 31 - 4 = 126972 bytes
	const maxDataSize =
		FIELD_ELEMENTS_PER_BLOB * (BYTES_PER_FIELD_ELEMENT - 1) - 4;

	if (data.length > maxDataSize) {
		throw new Error(
			`Data too large: ${data.length} bytes (max ${maxDataSize})`,
		);
	}

	const blob = new Uint8Array(SIZE);

	// Write 4-byte big-endian length prefix at positions 1-4 of first field element
	// (position 0 must be 0x00 for BLS field constraint)
	const view = new DataView(blob.buffer, blob.byteOffset, blob.byteLength);
	view.setUint32(1, data.length, false); // big-endian

	// Copy data starting at position 5 of first field element
	let dataOffset = 0;
	let blobOffset = 5; // Start after length prefix (0 + 1-4)

	while (dataOffset < data.length) {
		const fieldIndex = Math.floor(blobOffset / BYTES_PER_FIELD_ELEMENT);
		const fieldStart = fieldIndex * BYTES_PER_FIELD_ELEMENT;
		const posInField = blobOffset - fieldStart;

		// Skip position 0 of each field element (must be 0x00)
		if (posInField === 0) {
			blobOffset = fieldStart + 1;
			continue;
		}

		// Copy data byte (index is always in bounds by construction)
		blob[blobOffset] = /** @type {number} */ (data[dataOffset]);
		dataOffset++;
		blobOffset++;
	}

	// Rest is already zero-padded from Uint8Array construction

	return /** @type {import('./BlobType.js').BrandedBlob} */ (blob);
}
