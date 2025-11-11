import {
	BYTES_PER_BLOB,
	BYTES_PER_FIELD_ELEMENT,
	FIELD_ELEMENTS_PER_BLOB,
} from "./constants.js";
import { KzgInvalidBlobError } from "./errors.js";

/**
 * Validate blob format
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Uint8Array} blob - Blob to validate
 * @returns {void}
 * @throws {KzgInvalidBlobError} If blob is invalid
 * @example
 * ```javascript
 * import { validateBlob } from './crypto/KZG/index.js';
 * validateBlob(blob); // throws if invalid
 * ```
 */
export function validateBlob(blob) {
	if (!(blob instanceof Uint8Array)) {
		throw new KzgInvalidBlobError("Blob must be Uint8Array");
	}
	if (blob.length !== BYTES_PER_BLOB) {
		throw new KzgInvalidBlobError(
			`Blob must be ${BYTES_PER_BLOB} bytes, got ${blob.length}`,
		);
	}
	// Validate that each field element has top byte = 0
	for (let i = 0; i < FIELD_ELEMENTS_PER_BLOB; i++) {
		const offset = i * BYTES_PER_FIELD_ELEMENT;
		if (blob[offset] !== 0) {
			throw new KzgInvalidBlobError(
				`Invalid field element at index ${i}: top byte must be 0`,
			);
		}
	}
}
