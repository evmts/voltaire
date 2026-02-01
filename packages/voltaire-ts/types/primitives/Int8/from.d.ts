/**
 * Create a BrandedInt8 from a number, bigint, hex string, or another BrandedInt8
 * @param {number | bigint | string | import("./Int8Type.js").BrandedInt8} value
 * @returns {import("./Int8Type.js").BrandedInt8}
 * @throws {InvalidFormatError} If value is not an integer or invalid hex
 * @throws {IntegerOverflowError} If value exceeds INT8_MAX
 * @throws {IntegerUnderflowError} If value is below INT8_MIN
 */
export function from(value: number | bigint | string | import("./Int8Type.js").BrandedInt8): import("./Int8Type.js").BrandedInt8;
/**
 * Create a BrandedInt8 from a number
 * @param {number} value
 * @returns {import("./Int8Type.js").BrandedInt8}
 * @throws {InvalidFormatError} If value is not an integer
 * @throws {IntegerOverflowError} If value exceeds INT8_MAX
 * @throws {IntegerUnderflowError} If value is below INT8_MIN
 */
export function fromNumber(value: number): import("./Int8Type.js").BrandedInt8;
/**
 * Create a BrandedInt8 from a bigint
 * @param {bigint} value
 * @returns {import("./Int8Type.js").BrandedInt8}
 * @throws {IntegerOverflowError} If value exceeds INT8_MAX
 * @throws {IntegerUnderflowError} If value is below INT8_MIN
 */
export function fromBigint(value: bigint): import("./Int8Type.js").BrandedInt8;
/**
 * Create a BrandedInt8 from a hex string (two's complement)
 * @param {string} hex - "0xFF" for -1, "0x80" for -128, "0x7F" for 127
 * @returns {import("./Int8Type.js").BrandedInt8}
 * @throws {InvalidFormatError} If hex string is invalid
 */
export function fromHex(hex: string): import("./Int8Type.js").BrandedInt8;
/**
 * Create a BrandedInt8 from bytes (two's complement)
 * @param {Uint8Array} bytes - single byte
 * @returns {import("./Int8Type.js").BrandedInt8}
 * @throws {InvalidLengthError} If bytes length is not 1
 */
export function fromBytes(bytes: Uint8Array): import("./Int8Type.js").BrandedInt8;
//# sourceMappingURL=from.d.ts.map