import { BYTES_PER_BLOB, BYTES_PER_FIELD_ELEMENT, FIELD_ELEMENTS_PER_BLOB } from "./constants.js";
import { KzgInvalidBlobError } from "./errors.ts";

/**
 * Validate blob format
 *
 * @param {Uint8Array} blob - Blob to validate
 * @throws {KzgInvalidBlobError} If blob is invalid
 *
 * @example
 * ```typescript
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
