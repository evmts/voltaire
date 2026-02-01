/**
 * Create Int32 from bytes (big-endian, two's complement)
 *
 * @param {Uint8Array} bytes - Bytes to convert (up to 4 bytes)
 * @returns {import('./Int32Type.js').BrandedInt32} Int32 value
 * @throws {InvalidLengthError} If bytes length exceeds 4
 */
export function fromBytes(bytes: Uint8Array): import("./Int32Type.js").BrandedInt32;
//# sourceMappingURL=fromBytes.d.ts.map