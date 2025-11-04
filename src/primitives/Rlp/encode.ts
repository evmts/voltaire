import type { BrandedRlp } from "./BrandedRlp.js";
import { encodeBytes } from "./encodeBytes.js";
import { encodeList } from "./encodeList.js";
import { Error } from "./errors.js";
import { isData } from "./isData.js";

/**
 * Encodable types
 */
export type Encodable = Uint8Array | BrandedRlp | Encodable[];

/**
 * Encodes data to RLP format
 *
 * @param data - Data to encode (Uint8Array, RlpData, or array)
 * @returns RLP-encoded bytes
 *
 * @example
 * ```typescript
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
export function encode(data: Encodable): Uint8Array {
	// Handle Uint8Array
	if (data instanceof Uint8Array) {
		return encodeBytes(data);
	}

	// Handle Data structure
	if (isData(data)) {
		if (data.type === "bytes") {
			return encodeBytes(data.value);
		} else {
			return encodeList(data.value);
		}
	}

	// Handle array (list)
	if (Array.isArray(data)) {
		return encodeList(data);
	}

	throw new Error("UnexpectedInput", "Invalid encodable data type");
}
