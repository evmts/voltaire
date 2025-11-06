import { decode } from "./decode.js";
import { toRaw } from "./toRaw.js";

/**
 * Decodes RLP-encoded bytes to an object with known keys
 *
 * @param {Uint8Array} data - RLP-encoded data
 * @returns {Record<string, any>} Decoded object
 *
 * @example
 * ```javascript
 * const obj = { name: new Uint8Array([65, 66]), age: new Uint8Array([25]) };
 * const encoded = Rlp.encodeObject(obj);
 * const decoded = Rlp.decodeObject(encoded);
 * ```
 */
export function decodeObject(data) {
	const decoded = decode(data);
	const raw = toRaw(decoded.data);

	if (!Array.isArray(raw)) {
		throw new Error("Expected array from decode");
	}

	/** @type {Record<string, any>} */
	const result = {};
	const decoder = new TextDecoder();

	for (let i = 0; i < raw.length; i++) {
		const entry = raw[i];
		if (Array.isArray(entry) && entry.length === 2) {
			const keyBytes = entry[0];
			const value = entry[1];

			if (keyBytes instanceof Uint8Array) {
				const key = decoder.decode(keyBytes);
				result[key] = value;
			}
		}
	}

	return result;
}
