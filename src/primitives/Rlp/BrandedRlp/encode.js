import * as OxRlp from "ox/Rlp";
import { Error } from "./errors.js";
import { isData } from "./isData.js";

/**
 * @typedef {Uint8Array | import('./BrandedRlp.js').BrandedRlp | Array<Uint8Array | import('./BrandedRlp.js').BrandedRlp | any>} Encodable
 */

/**
 * Convert Data structure to ox/Rlp compatible format
 * @internal
 * @param {import('./BrandedRlp.js').BrandedRlp} data
 * @returns {Uint8Array | any[]}
 */
function dataToEncodable(data) {
	if (data.type === "bytes") {
		return data.value;
	}
	return data.value.map((item) => dataToEncodable(item));
}

/**
 * Encodes data to RLP format
 *
 * @param {Encodable} data - Data to encode (Uint8Array, RlpData, or array)
 * @returns {Uint8Array} RLP-encoded bytes
 *
 * @example
 * ```javascript
 * // Encode bytes
 * const bytes = new Uint8Array([1, 2, 3]);
 * const encoded = Rlp.encode(bytes);
 *
 * // Encode list
 * const list = [new Uint8Array([1, 2]), new Uint8Array([3, 4])];
 * const encoded = Rlp.encode(list);
 *
 * // Encode nested structures
 * const nested = [new Uint8Array([1]), [new Uint8Array([2]), new Uint8Array([3])]];
 * const encoded = Rlp.encode(nested);
 * ```
 *
 * Rules:
 * - Single byte < 0x80: encoded as itself
 * - Byte array 0-55 bytes: [0x80 + length, ...bytes]
 * - Byte array > 55 bytes: [0xb7 + length_of_length, ...length_bytes, ...bytes]
 * - List 0-55 bytes total: [0xc0 + length, ...encoded_items]
 * - List > 55 bytes total: [0xf7 + length_of_length, ...length_bytes, ...encoded_items]
 */
export function encode(data) {
	// Handle Data structure
	if (isData(data)) {
		const encodable = dataToEncodable(data);
		return OxRlp.from(encodable, { as: "Bytes" });
	}

	// Handle Uint8Array and arrays directly
	if (data instanceof Uint8Array || Array.isArray(data)) {
		return OxRlp.from(data, { as: "Bytes" });
	}

	throw new Error("UnexpectedInput", "Invalid encodable data type");
}
