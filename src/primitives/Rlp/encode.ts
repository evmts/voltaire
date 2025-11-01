import type { Encodable } from "./Rlp.js";
import { Error } from "./errors.js";
import { isData } from "./isData.js";
import { encodeBytes } from "./encodeBytes.js";
import { encodeList } from "./encodeList.js";

/**
 * Encodes data to RLP format (this: pattern)
 *
 * @param this - Data to encode (Uint8Array, RlpData, or array)
 * @returns RLP-encoded bytes
 *
 * @example
 * ```typescript
 * // Encode bytes
 * const bytes = new Uint8Array([1, 2, 3]);
 * const encoded = Rlp.encode.call(bytes);
 *
 * // Encode list
 * const list = [new Uint8Array([1, 2]), new Uint8Array([3, 4])];
 * const encoded = Rlp.encode.call(list);
 *
 * // Encode nested structures
 * const nested = [new Uint8Array([1]), [new Uint8Array([2]), new Uint8Array([3])]];
 * const encoded = Rlp.encode.call(nested);
 * ```
 *
 * Rules:
 * - Single byte < 0x80: encoded as itself
 * - Byte array 0-55 bytes: [0x80 + length, ...bytes]
 * - Byte array > 55 bytes: [0xb7 + length_of_length, ...length_bytes, ...bytes]
 * - List 0-55 bytes total: [0xc0 + length, ...encoded_items]
 * - List > 55 bytes total: [0xf7 + length_of_length, ...length_bytes, ...encoded_items]
 */
export function encode(this: Encodable): Uint8Array {
	// Handle Uint8Array
	if (this instanceof Uint8Array) {
		return encodeBytes.call(this);
	}

	// Handle Data structure
	if (isData(this)) {
		if (this.type === "bytes") {
			return encodeBytes.call(this.value);
		} else {
			return encodeList.call(this.value);
		}
	}

	// Handle array (list)
	if (Array.isArray(this)) {
		return encodeList.call(this);
	}

	throw new Error("UnexpectedInput", "Invalid encodable data type");
}
