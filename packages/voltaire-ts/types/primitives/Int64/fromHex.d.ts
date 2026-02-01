/**
 * Create Int64 from hex string (two's complement)
 *
 * @param {string} hex - Hex string (with or without 0x prefix)
 * @returns {import('./Int64Type.js').BrandedInt64} Int64 value
 * @throws {InvalidLengthError} If hex exceeds 8 bytes
 * @throws {InvalidFormatError} If hex is invalid
 */
export function fromHex(hex: string): import("./Int64Type.js").BrandedInt64;
//# sourceMappingURL=fromHex.d.ts.map