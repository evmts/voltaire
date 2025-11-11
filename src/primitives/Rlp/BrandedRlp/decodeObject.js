import { decode } from "./decode.js";
import { toRaw } from "./toRaw.js";

/**
 * Decodes RLP-encoded bytes to an object with known keys
 *
 * @see https://voltaire.tevm.sh/primitives/rlp for RLP documentation
 * @since 0.0.0
 * @param {Uint8Array} data - RLP-encoded data
 * @returns {Record<string, any>} Decoded object
 * @throws {Error} If decoding fails or data format is invalid
 * @example
 * ```javascript
 * import * as Rlp from './primitives/Rlp/index.js';
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
