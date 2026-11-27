import { DecodingError } from "../errors/index.js";

const ALPHABET =
	"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const BASE64_REGEX = /^[A-Za-z0-9+/]*={0,2}$/;

const DECODE_TABLE = new Uint8Array(128).fill(255);
for (let i = 0; i < ALPHABET.length; i++) {
	DECODE_TABLE[ALPHABET.charCodeAt(i)] = i;
}

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
	const len = encoded.length;
	if (len === 0) {
		return new Uint8Array(0);
	}

	if (!BASE64_REGEX.test(encoded) || len % 4 !== 0) {
		throw new DecodingError("Invalid base64 format", {
			code: -32602,
			context: { value: encoded },
			docsPath: "/primitives/base64/decode#error-handling",
		});
	}

	const pad = encoded.endsWith("==") ? 2 : encoded.endsWith("=") ? 1 : 0;
	const outLen = (len / 4) * 3 - pad;
	const out = new Uint8Array(outLen);
	const fullEnd = pad > 0 ? len - 4 : len;
	let outIdx = 0;

	for (let i = 0; i < fullEnd; i += 4) {
		const c0 = /** @type {number} */ (DECODE_TABLE[encoded.charCodeAt(i)]);
		const c1 = /** @type {number} */ (DECODE_TABLE[encoded.charCodeAt(i + 1)]);
		const c2 = /** @type {number} */ (DECODE_TABLE[encoded.charCodeAt(i + 2)]);
		const c3 = /** @type {number} */ (DECODE_TABLE[encoded.charCodeAt(i + 3)]);
		out[outIdx++] = (c0 << 2) | (c1 >> 4);
		out[outIdx++] = ((c1 & 0x0f) << 4) | (c2 >> 2);
		out[outIdx++] = ((c2 & 0x03) << 6) | c3;
	}

	if (pad === 1) {
		const c0 = /** @type {number} */ (
			DECODE_TABLE[encoded.charCodeAt(fullEnd)]
		);
		const c1 = /** @type {number} */ (
			DECODE_TABLE[encoded.charCodeAt(fullEnd + 1)]
		);
		const c2 = /** @type {number} */ (
			DECODE_TABLE[encoded.charCodeAt(fullEnd + 2)]
		);
		out[outIdx++] = (c0 << 2) | (c1 >> 4);
		out[outIdx] = ((c1 & 0x0f) << 4) | (c2 >> 2);
	} else if (pad === 2) {
		const c0 = /** @type {number} */ (
			DECODE_TABLE[encoded.charCodeAt(fullEnd)]
		);
		const c1 = /** @type {number} */ (
			DECODE_TABLE[encoded.charCodeAt(fullEnd + 1)]
		);
		out[outIdx] = (c0 << 2) | (c1 >> 4);
	}

	return out;
}
