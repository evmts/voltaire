/**
 * Create ReturnData from hex string
 *
 * @param {string} value - Hex string (with or without 0x prefix)
 * @returns {import('./ReturnDataType.js').ReturnDataType} ReturnData
 * @throws {InvalidHexFormatError} If hex string is invalid
 *
 * @example
 * ```typescript
 * const data = ReturnData.fromHex("0x00000001");
 * ```
 */
export function fromHex(value: string): import("./ReturnDataType.js").ReturnDataType;
//# sourceMappingURL=fromHex.d.ts.map