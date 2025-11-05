import { Error } from "./errors.js";
import { isData } from "./isData.js";
import { encodeLengthValue } from "./utils.js";

/**
 * Get the total byte length of RLP-encoded data without actually encoding
 *
 * @param {Uint8Array | import('./BrandedRlp.js').BrandedRlp | any[]} data - Data to measure
 * @returns {number} Length in bytes after RLP encoding
 *
 * @example
 * ```javascript
 * const bytes = new Uint8Array([1, 2, 3]);
 * const length = Rlp.getEncodedLength(bytes);
 * // => 4 (0x83 prefix + 3 bytes)
 * ```
 */
export function getEncodedLength(data) {
	// Handle Uint8Array
	if (data instanceof Uint8Array) {
		if (data.length === 1 && (data[0] ?? 0) < 0x80) {
			return 1;
		}
		if (data.length < 56) {
			return 1 + data.length;
		}
		const lengthBytes = encodeLengthValue(data.length);
		return 1 + lengthBytes.length + data.length;
	}

	// Handle Data structure
	if (isData(data)) {
		if (data.type === "bytes") {
			return getEncodedLength(data.value);
		} else {
			return getEncodedLength(data.value);
		}
	}

	// Handle array (list)
	if (Array.isArray(data)) {
		const totalLength = data.reduce(
			(sum, item) => sum + getEncodedLength(item),
			0,
		);
		if (totalLength < 56) {
			return 1 + totalLength;
		}
		const lengthBytes = encodeLengthValue(totalLength);
		return 1 + lengthBytes.length + totalLength;
	}

	throw new Error("UnexpectedInput", "Invalid encodable data type");
}
