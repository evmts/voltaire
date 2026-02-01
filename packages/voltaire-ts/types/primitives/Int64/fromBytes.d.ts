/**
 * Create Int64 from bytes (big-endian, two's complement)
 *
 * @param {Uint8Array} bytes - Bytes to convert (up to 8 bytes)
 * @returns {import('./Int64Type.js').BrandedInt64} Int64 value
 * @throws {InvalidLengthError} If bytes length exceeds 8
 */
export function fromBytes(bytes: Uint8Array): import("./Int64Type.js").BrandedInt64;
//# sourceMappingURL=fromBytes.d.ts.map