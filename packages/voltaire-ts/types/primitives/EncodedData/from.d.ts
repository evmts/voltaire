/**
 * Create EncodedData from various input types
 *
 * @param {string | Uint8Array} value - Hex string or Uint8Array
 * @returns {import('./EncodedDataType.js').EncodedDataType} EncodedData
 * @throws {InvalidValueError} If value type is unsupported
 * @throws {InvalidHexFormatError} If hex string is invalid
 *
 * @example
 * ```typescript
 * const data1 = EncodedData.from("0x0000...");
 * const data2 = EncodedData.from(new Uint8Array([0, 0, ...]));
 * ```
 */
export function from(value: string | Uint8Array): import("./EncodedDataType.js").EncodedDataType;
//# sourceMappingURL=from.d.ts.map