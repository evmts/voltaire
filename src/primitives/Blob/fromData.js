import {
	SIZE,
	BYTES_PER_FIELD_ELEMENT,
	FIELD_ELEMENTS_PER_BLOB,
} from "./constants.js";

/**
 * Create blob from arbitrary data using field element encoding
 * Each field element: 0x00 (high byte) + 31 data bytes
 * Last element with data < 31 bytes gets 0x80 terminator
 *
 * @see https://voltaire.tevm.sh/primitives/blob for Blob documentation
 * @since 0.0.0
 * @param {Uint8Array} data - Data to encode (max ~126KB = 4096 * 31 bytes)
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
	const maxDataPerBlob =
		FIELD_ELEMENTS_PER_BLOB * (BYTES_PER_FIELD_ELEMENT - 1);

	if (data.length > maxDataPerBlob) {
		throw new Error(
			`Data too large: ${data.length} bytes (max ${maxDataPerBlob})`,
		);
	}

	const blob = new Uint8Array(SIZE);
	let position = 0;
	let fieldElementIndex = 0;

	// Encode data into field elements (31 bytes per element)
	while (
		position < data.length &&
		fieldElementIndex < FIELD_ELEMENTS_PER_BLOB
	) {
		const offset = fieldElementIndex * BYTES_PER_FIELD_ELEMENT;

		// High byte must be 0x00
		blob[offset] = 0x00;

		// Copy up to 31 bytes of data
		const bytesToCopy = Math.min(31, data.length - position);
		blob.set(data.subarray(position, position + bytesToCopy), offset + 1);

		// If this is the last segment and < 31 bytes, add terminator
		if (bytesToCopy < 31) {
			blob[offset + 1 + bytesToCopy] = 0x80;
			break;
		}

		position += bytesToCopy;
		fieldElementIndex++;
	}

	return /** @type {import('../BrandedBlob.js').BrandedBlob} */ (blob);
}
