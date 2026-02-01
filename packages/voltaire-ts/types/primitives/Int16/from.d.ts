/**
 * Create a BrandedInt16 from a number, bigint, hex string, or another BrandedInt16
 * @param {number | bigint | string | import("./Int16Type.js").BrandedInt16} value
 * @returns {import("./Int16Type.js").BrandedInt16}
 * @throws {InvalidFormatError} If value is not an integer or invalid hex
 * @throws {IntegerOverflowError} If value exceeds INT16_MAX
 * @throws {IntegerUnderflowError} If value is below INT16_MIN
 */
export function from(value: number | bigint | string | import("./Int16Type.js").BrandedInt16): import("./Int16Type.js").BrandedInt16;
/**
 * Create a BrandedInt16 from a number
 * @param {number} value
 * @returns {import("./Int16Type.js").BrandedInt16}
 * @throws {InvalidFormatError} If value is not an integer
 * @throws {IntegerOverflowError} If value exceeds INT16_MAX
 * @throws {IntegerUnderflowError} If value is below INT16_MIN
 */
export function fromNumber(value: number): import("./Int16Type.js").BrandedInt16;
/**
 * Create a BrandedInt16 from a bigint
 * @param {bigint} value
 * @returns {import("./Int16Type.js").BrandedInt16}
 * @throws {IntegerOverflowError} If value exceeds INT16_MAX
 * @throws {IntegerUnderflowError} If value is below INT16_MIN
 */
export function fromBigint(value: bigint): import("./Int16Type.js").BrandedInt16;
/**
 * Create a BrandedInt16 from a hex string (two's complement)
 * @param {string} hex - "0xFFFF" for -1, "0x8000" for -32768, "0x7FFF" for 32767
 * @returns {import("./Int16Type.js").BrandedInt16}
 * @throws {InvalidFormatError} If hex string is invalid
 */
export function fromHex(hex: string): import("./Int16Type.js").BrandedInt16;
/**
 * Create a BrandedInt16 from bytes (two's complement, big-endian)
 * @param {Uint8Array} bytes - 2 bytes
 * @returns {import("./Int16Type.js").BrandedInt16}
 * @throws {InvalidLengthError} If bytes length is not 2
 */
export function fromBytes(bytes: Uint8Array): import("./Int16Type.js").BrandedInt16;
//# sourceMappingURL=from.d.ts.map