import * as Hex from "../Hex/index.js";

/**
 * Create EncodedData from Uint8Array
 *
 * @param {Uint8Array} value - Byte array
 * @returns {import('./EncodedDataType.js').EncodedDataType} EncodedData
 *
 * @example
 * ```typescript
 * const data = EncodedData.fromBytes(new Uint8Array([0, 0, 0, 1]));
 * ```
 */
export function fromBytes(value) {
	const hex = Hex.fromBytes(value);
	return /** @type {import('./EncodedDataType.js').EncodedDataType} */ (hex);
}
