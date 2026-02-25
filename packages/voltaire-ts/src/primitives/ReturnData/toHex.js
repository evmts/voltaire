import * as Hex from "../Hex/index.js";

/**
 * Convert ReturnData to hex string
 *
 * @param {import('./ReturnDataType.js').ReturnDataType} data - ReturnData
 * @returns {import('../Hex/HexType.js').HexType} Hex string with 0x prefix
 *
 * @example
 * ```typescript
 * const hex = ReturnData.toHex(data); // "0x00000001"
 * ```
 */
export function toHex(data) {
	return Hex.fromBytes(data);
}
