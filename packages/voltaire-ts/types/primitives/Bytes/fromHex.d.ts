/**
 * Create Bytes from hex string
 *
 * @param {string} hex - Hex string with 0x prefix
 * @returns {import('./BytesType.js').BytesType} Bytes
 * @throws {InvalidBytesFormatError} If hex string is invalid
 *
 * @example
 * ```typescript
 * const bytes = Bytes.fromHex("0x1234");
 * // Uint8Array([0x12, 0x34])
 * ```
 */
export function fromHex(hex: string): import("./BytesType.js").BytesType;
//# sourceMappingURL=fromHex.d.ts.map