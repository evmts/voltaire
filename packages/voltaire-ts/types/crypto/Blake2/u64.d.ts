/**
 * Right rotation for 64-bit values
 * @param {bigint} x - Value to rotate
 * @param {number} n - Number of bits to rotate
 * @returns {bigint} Rotated value
 */
export function rotr64(x: bigint, n: number): bigint;
/**
 * Read a little-endian 64-bit unsigned integer from bytes
 * @param {Uint8Array} data - Byte array
 * @param {number} offset - Offset in bytes
 * @returns {bigint} 64-bit value
 */
export function readU64LE(data: Uint8Array, offset: number): bigint;
/**
 * Write a little-endian 64-bit unsigned integer to bytes
 * @param {Uint8Array} data - Byte array
 * @param {number} offset - Offset in bytes
 * @param {bigint} value - 64-bit value
 */
export function writeU64LE(data: Uint8Array, offset: number, value: bigint): void;
//# sourceMappingURL=u64.d.ts.map