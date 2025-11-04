import { encodeLengthValue } from "./utils.js";

/**
 * Encodes a byte array according to RLP string rules
 *
 * @param bytes - Byte array to encode
 * @returns RLP-encoded bytes
 *
 * @example
 * ```typescript
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
 *
 * Rules:
 * - Single byte < 0x80: return as-is (no prefix)
 * - 0-55 bytes: [0x80 + length, ...bytes]
 * - > 55 bytes: [0xb7 + length_of_length, ...length_bytes, ...bytes]
 */
export function encodeBytes(bytes: Uint8Array): Uint8Array {
	// Single byte < 0x80: encoded as itself
	if (bytes.length === 1 && bytes[0]! < 0x80) {
		return bytes;
	}

	// Short string (0-55 bytes)
	if (bytes.length < 56) {
		const result = new Uint8Array(1 + bytes.length);
		result[0] = 0x80 + bytes.length;
		result.set(bytes, 1);
		return result;
	}

	// Long string (56+ bytes)
	const lengthBytes = encodeLengthValue(bytes.length);
	const result = new Uint8Array(1 + lengthBytes.length + bytes.length);
	result[0] = 0xb7 + lengthBytes.length;
	result.set(lengthBytes, 1);
	result.set(bytes, 1 + lengthBytes.length);
	return result;
}
