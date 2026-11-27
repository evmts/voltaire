import { RlpEncodingError } from "./RlpError.js";

/**
 * Encode a positive integer length as minimal big-endian bytes
 * @internal
 * @param {number} length
 * @returns {Uint8Array}
 */
function encodeLength(length) {
	/** @type {number[]} */
	const lenBytes = [];
	let n = length;
	while (n > 0) {
		lenBytes.unshift(n & 0xff);
		n = Math.floor(n / 256);
	}
	return new Uint8Array(lenBytes);
}

/**
 * Encodes a byte array according to RLP string rules
 *
 * @see https://voltaire.tevm.sh/primitives/rlp for RLP documentation
 * @since 0.0.0
 * @param {Uint8Array} bytes - Byte array to encode
 * @returns {Uint8Array} RLP-encoded bytes
 * @throws {import('./RlpError.js').RlpEncodingError} If encoding fails
 * @example
 * ```javascript
 * import * as Rlp from './primitives/Rlp/index.js';
 * // Single byte < 0x80
 * const b1 = new Uint8Array([0x7f]);
 * const encoded = Rlp.encodeBytes(b1);
 * // => Uint8Array([0x7f])
 *
 * // Short string
 * const b2 = new Uint8Array([1, 2, 3]);
 * const encoded = Rlp.encodeBytes(b2);
 * // => Uint8Array([0x83, 1, 2, 3])
 *
 * // Long string (> 55 bytes)
 * const longBytes = new Uint8Array(60).fill(0x42);
 * const encoded = Rlp.encodeBytes(longBytes);
 * // => Uint8Array([0xb8, 60, ...longBytes])
 * ```
 */
export function encodeBytes(bytes) {
	if (!(bytes instanceof Uint8Array)) {
		throw new RlpEncodingError("Expected Uint8Array for encodeBytes", {
			code: "RLP_INVALID_TYPE",
			context: { type: typeof bytes },
		});
	}

	const len = bytes.length;
	if (len === 1 && /** @type {number} */ (bytes[0]) < 0x80) {
		return new Uint8Array([/** @type {number} */ (bytes[0])]);
	}

	if (len <= 55) {
		const out = new Uint8Array(1 + len);
		out[0] = 0x80 + len;
		out.set(bytes, 1);
		return out;
	}

	const lenBytes = encodeLength(len);
	const out = new Uint8Array(1 + lenBytes.length + len);
	out[0] = 0xb7 + lenBytes.length;
	out.set(lenBytes, 1);
	out.set(bytes, 1 + lenBytes.length);
	return out;
}
