import * as OxBase64 from "ox/Base64";
import { DecodingError } from "../../errors/SerializationError.js";

/**
 * Decode standard base64 string to bytes
 *
 * @see https://voltaire.tevm.sh/primitives/base64 for Base64 documentation
 * @since 0.0.0
 * @param {string} encoded - Base64 string to decode
 * @returns {Uint8Array} Decoded bytes
 * @throws {DecodingError} If input is invalid base64
 * @example
 * ```javascript
 * import * as Base64 from './primitives/Base64/index.js';
 * const decoded = Base64.decode('SGVsbG8=');
 * // Uint8Array([72, 101, 108, 108, 111])
 * ```
 */
export function decode(encoded) {
	// Validate before decoding
	if (encoded.length > 0) {
		const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
		if (!base64Regex.test(encoded) || encoded.length % 4 !== 0) {
			throw new DecodingError("Invalid base64 format", {
				value: encoded,
				code: "BASE64_INVALID_FORMAT",
				docsPath: "/primitives/base64/decode#error-handling",
			});
		}
	}

	try {
		return OxBase64.toBytes(encoded);
	} catch (error) {
		throw new DecodingError("Invalid base64", {
			value: encoded,
			code: "BASE64_DECODE_FAILED",
			docsPath: "/primitives/base64/decode#error-handling",
			cause: /** @type {Error} */ (error),
		});
	}
}
