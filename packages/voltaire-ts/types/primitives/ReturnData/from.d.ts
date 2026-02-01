/**
 * Create ReturnData from various input types
 *
 * @param {string | Uint8Array} value - Hex string or Uint8Array
 * @returns {import('./ReturnDataType.js').ReturnDataType} ReturnData
 * @throws {InvalidValueError} If value type is unsupported
 * @throws {InvalidHexFormatError} If hex string is invalid
 *
 * @example
 * ```typescript
 * const data1 = ReturnData.from("0x0000...");
 * const data2 = ReturnData.from(new Uint8Array([0, 0, ...]));
 * ```
 */
export function from(value: string | Uint8Array): import("./ReturnDataType.js").ReturnDataType;
//# sourceMappingURL=from.d.ts.map