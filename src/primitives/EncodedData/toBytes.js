import * as Hex from "../Hex/index.js";

/**
 * Convert EncodedData to Uint8Array
 *
 * @param {import('./EncodedDataType.js').EncodedDataType} data - EncodedData
 * @returns {Uint8Array} Byte array
 *
 * @example
 * ```typescript
 * const bytes = EncodedData.toBytes(data);
 * ```
 */
export function toBytes(data) {
	return Hex.toBytes(data);
}
