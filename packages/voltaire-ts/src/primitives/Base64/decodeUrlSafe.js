import { DecodingError } from "../errors/index.js";
import { decode } from "./decode.js";

const URL_SAFE_REGEX = /^[A-Za-z0-9_-]*={0,2}$/;

/**
 * Decode URL-safe base64 string to bytes
 *
 * @param {string} encoded - URL-safe base64 string
 * @returns {Uint8Array} Decoded bytes
 * @throws {DecodingError} If input is invalid
 */
export function decodeUrlSafe(encoded) {
	if (encoded.length === 0) {
		return new Uint8Array(0);
	}

	if (!URL_SAFE_REGEX.test(encoded)) {
		throw new DecodingError("Invalid URL-safe base64 format", {
			code: -32602,
			context: { value: encoded },
			docsPath: "/primitives/base64/decode-url-safe#error-handling",
		});
	}

	const hasPadding = encoded.includes("=");
	if (hasPadding && encoded.length % 4 !== 0) {
		throw new DecodingError("Invalid URL-safe base64 padding", {
			code: -32602,
			context: { value: encoded },
			docsPath: "/primitives/base64/decode-url-safe#error-handling",
		});
	}

	const unpadded = hasPadding ? encoded.replace(/=+$/, "") : encoded;
	const rem = unpadded.length % 4;
	if (rem === 1) {
		throw new DecodingError("Invalid URL-safe base64 length", {
			code: -32602,
			context: { value: encoded },
			docsPath: "/primitives/base64/decode-url-safe#error-handling",
		});
	}

	const padLen = rem === 0 ? 0 : 4 - rem;
	const standard =
		unpadded.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(padLen);
	return decode(standard);
}
