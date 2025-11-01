import type { Encodable } from "./Rlp.js";
import { Error } from "./errors.js";
import { isData } from "./isData.js";
import { encodeLengthValue } from "./utils.js";

/**
 * Get the total byte length of RLP-encoded data without actually encoding (this: pattern)
 *
 * @param this - Data to measure
 * @returns Length in bytes after RLP encoding
 *
 * @example
 * ```typescript
 * const bytes = new Uint8Array([1, 2, 3]);
 * const length = Rlp.getEncodedLength.call(bytes);
 * // => 4 (0x83 prefix + 3 bytes)
 * ```
 */
export function getEncodedLength(this: Encodable): number {
	// Handle Uint8Array
	if (this instanceof Uint8Array) {
		if (this.length === 1 && this[0]! < 0x80) {
			return 1;
		}
		if (this.length < 56) {
			return 1 + this.length;
		}
		const lengthBytes = encodeLengthValue(this.length);
		return 1 + lengthBytes.length + this.length;
	}

	// Handle Data structure
	if (isData(this)) {
		if (this.type === "bytes") {
			return getEncodedLength.call(this.value);
		} else {
			return getEncodedLength.call(this.value);
		}
	}

	// Handle array (list)
	if (Array.isArray(this)) {
		const totalLength = this.reduce((sum, item) => sum + getEncodedLength.call(item), 0);
		if (totalLength < 56) {
			return 1 + totalLength;
		}
		const lengthBytes = encodeLengthValue(totalLength);
		return 1 + lengthBytes.length + totalLength;
	}

	throw new Error("UnexpectedInput", "Invalid encodable data type");
}
