/**
 * Convert unsigned 256-bit BigInt to signed 256-bit BigInt
 *
 * Interprets the BigInt as a two's complement signed integer.
 * Values >= 2^255 are negative.
 *
 * @param {bigint} value - Unsigned 256-bit value
 * @returns {bigint} Signed 256-bit value
 */
export function toSigned256(value) {
	// If high bit is set (>= 2^255), value is negative
	const MAX_INT256 = 1n << 255n;
	if (value >= MAX_INT256) {
		// Convert from two's complement
		return value - (1n << 256n);
	}
	return value;
}
