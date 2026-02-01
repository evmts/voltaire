/**
 * Create CallData from hex string
 *
 * @param {string} hex - Hex-encoded string (with or without 0x prefix)
 * @returns {import('./CallDataType.js').CallDataType} Branded CallData
 * @throws {InvalidHexFormatError} If hex string is invalid
 * @throws {InvalidCallDataLengthError} If decoded bytes length is less than 4
 *
 * @example
 * ```javascript
 * const calldata = CallData.fromHex("0xa9059cbb...");
 * ```
 */
export function fromHex(hex: string): import("./CallDataType.js").CallDataType;
//# sourceMappingURL=fromHex.d.ts.map