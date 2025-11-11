import {
	BYTES_PER_BLOB,
	BYTES_PER_FIELD_ELEMENT,
	FIELD_ELEMENTS_PER_BLOB,
} from "./constants.js";
import { KzgError } from "./errors.js";

/**
 * Generate random valid blob (for testing)
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {number} [seed] - Optional seed for deterministic generation
 * @returns {Uint8Array} Random blob with valid field elements
 * @throws {KzgError} If crypto.getRandomValues not available
 * @example
 * ```javascript
 * import { generateRandomBlob } from './crypto/KZG/index.js';
 * const blob = generateRandomBlob();
 * const deterministicBlob = generateRandomBlob(12345);
 * ```
 */
export function generateRandomBlob(seed) {
	const blob = new Uint8Array(BYTES_PER_BLOB);
	if (seed !== undefined) {
		// Simple seeded PRNG
		let x = seed;
		for (let i = 0; i < blob.length; i++) {
			x = (x * 1103515245 + 12345) & 0x7fffffff;
			blob[i] = (x >>> 16) & 0xff;
		}
	} else {
		// Use crypto random in chunks (getRandomValues has 65536 byte limit)
		if (typeof crypto !== "undefined" && crypto.getRandomValues) {
			const chunkSize = 65536;
			for (let offset = 0; offset < blob.length; offset += chunkSize) {
				const end = Math.min(offset + chunkSize, blob.length);
				crypto.getRandomValues(blob.subarray(offset, end));
			}
		} else {
			throw new KzgError("crypto.getRandomValues not available", {
				code: "KZG_NO_CRYPTO_API",
				docsPath: "/crypto/kzg/generate-random-blob#error-handling",
			});
		}
	}
	// Ensure each field element is valid by clearing top byte
	for (let i = 0; i < FIELD_ELEMENTS_PER_BLOB; i++) {
		blob[i * BYTES_PER_FIELD_ELEMENT] = 0;
	}
	return blob;
}
