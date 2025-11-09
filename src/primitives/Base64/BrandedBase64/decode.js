import * as OxBase64 from "ox/Base64";

/**
 * Decode standard base64 string to bytes
 *
 * @param {string} encoded - Base64 string to decode
 * @returns {Uint8Array} Decoded bytes
 * @throws {Error} If input is invalid base64
 *
 * @example
 * ```typescript
 * const decoded = Base64.decode('SGVsbG8=');
 * // Uint8Array([72, 101, 108, 108, 111])
 * ```
 */
export function decode(encoded) {
	// Validate before decoding
	if (encoded.length > 0) {
		const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
		if (!base64Regex.test(encoded) || encoded.length % 4 !== 0) {
			throw new Error("Invalid base64");
		}
	}

	try {
		return OxBase64.toBytes(encoded);
	} catch (error) {
		throw new Error(`Invalid base64: ${error}`);
	}
}
