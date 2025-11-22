import {
	SIZE,
	BYTES_PER_FIELD_ELEMENT,
	FIELD_ELEMENTS_PER_BLOB,
} from "./constants.js";

/**
 * Extract data from blob using field element decoding
 * Each field element: 0x00 (high byte) + 31 data bytes
 * Stops at 0x80 terminator
 *
 * @see https://voltaire.tevm.sh/primitives/blob for Blob documentation
 * @since 0.0.0
 * @param {import('../BrandedBlob.js').BrandedBlob} blob - Blob data
 * @returns {Uint8Array} Original data
 * @throws {Error} If blob size is invalid
 * @example
 * ```javascript
 * import * as Blob from './primitives/Blob/index.js';
 * const data = Blob.toData(blob);
 * const text = new TextDecoder().decode(data);
 * ```
 */
export function toData(blob) {
	if (blob.length !== SIZE) {
		throw new Error(`Invalid blob size: ${blob.length} (expected ${SIZE})`);
	}

	const maxDataSize = FIELD_ELEMENTS_PER_BLOB * (BYTES_PER_FIELD_ELEMENT - 1);
	const data = new Uint8Array(maxDataSize);
	let dataPosition = 0;

	// Decode field elements
	for (let i = 0; i < FIELD_ELEMENTS_PER_BLOB; i++) {
		const offset = i * BYTES_PER_FIELD_ELEMENT;

		// Skip high byte (must be 0x00)
		let elementPosition = offset + 1;

		// Read up to 31 bytes from this field element
		for (let j = 0; j < 31; j++) {
			const byte = blob[elementPosition];
			elementPosition++;

			// Check for terminator (0x80 followed by no more non-zero data)
			if (byte === 0x80) {
				// Check remaining blob for any non-zero bytes
				const remaining = blob.slice(elementPosition);
				let foundNonZero = false;
				for (let k = 0; k < remaining.length; k++) {
					if (remaining[k] !== 0x00) {
						foundNonZero = true;
						break;
					}
				}

				// If no non-zero bytes after 0x80, it's the terminator
				if (!foundNonZero) {
					return data.slice(0, dataPosition);
				}
			}

			data[dataPosition] = byte;
			dataPosition++;
		}
	}

	return data.slice(0, dataPosition);
}
