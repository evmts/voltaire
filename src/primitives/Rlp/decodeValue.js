import { decode } from "./decode.js";

/**
 * @typedef {Uint8Array | RawRlpValue[]} RawRlpValue
 */

/**
 * Converts BrandedRlp data structure to raw value
 * @internal
 * @param {import('./RlpType.js').BrandedRlp} data
 * @returns {RawRlpValue}
 */
function toRawValue(data) {
	if (data.type === "bytes") {
		return data.value;
	}
	return data.value.map(toRawValue);
}

/**
 * Decodes RLP-encoded bytes and returns just the decoded value
 *
 * This is a convenience wrapper around decode() that extracts the value directly,
 * omitting the remainder and type metadata. Use this when you have complete RLP data
 * and just want the decoded result.
 *
 * @see https://voltaire.tevm.sh/primitives/rlp for RLP documentation
 * @since 0.1.42
 * @param {Uint8Array} bytes - RLP-encoded data
 * @returns {RawRlpValue} Decoded value (Uint8Array for bytes, array for list)
 * @throws {import('./RlpError.js').RlpDecodingError} If input is too short, invalid, or has extra data
 * @example
 * ```javascript
 * import * as Rlp from './primitives/Rlp/index.js';
 *
 * // Decode bytes - returns Uint8Array directly
 * const bytes = new Uint8Array([0x83, 1, 2, 3]);
 * const value = Rlp.decodeValue(bytes);
 * // => Uint8Array([1, 2, 3])
 *
 * // Decode list - returns array directly
 * const list = new Uint8Array([0xc3, 0x01, 0x02, 0x03]);
 * const items = Rlp.decodeValue(list);
 * // => [Uint8Array([1]), Uint8Array([2]), Uint8Array([3])]
 *
 * // Compare with decode() which returns full structure:
 * // Rlp.decode(bytes) => { data: { type: 'bytes', value: Uint8Array([1,2,3]) }, remainder: Uint8Array([]) }
 * // Rlp.decodeValue(bytes) => Uint8Array([1, 2, 3])
 * ```
 */
export function decodeValue(bytes) {
	const { data } = decode(bytes, false);
	return toRawValue(data);
}
