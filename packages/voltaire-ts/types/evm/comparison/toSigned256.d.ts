/**
 * Convert unsigned 256-bit BigInt to signed 256-bit BigInt
 *
 * Interprets the BigInt as a two's complement signed integer.
 * Values >= 2^255 are negative.
 *
 * @param {bigint} value - Unsigned 256-bit value
 * @returns {bigint} Signed 256-bit value
 */
export function toSigned256(value: bigint): bigint;
//# sourceMappingURL=toSigned256.d.ts.map