import * as OxRlp from "ox/Rlp";

/**
 * Encodes a byte array according to RLP string rules
 *
 * @see https://voltaire.tevm.sh/primitives/rlp for RLP documentation
 * @since 0.0.0
 * @param {Uint8Array} bytes - Byte array to encode
 * @returns {Uint8Array} RLP-encoded bytes
 * @throws {Error} If encoding fails
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
	return OxRlp.from(bytes, { as: "Bytes" });
}
