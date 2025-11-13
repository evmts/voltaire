import { INT8_MAX, INT8_MIN } from "./BrandedInt8.ts";

/**
 * Get bit length (number of bits needed to represent value)
 * @param {import('./BrandedInt8.ts').BrandedInt8} value
 * @returns {number}
 */
export function bitLength(value) {
	if (value === 0) return 0;
	// For negative numbers, use absolute value
	const absValue = value < 0 ? -value : value;
	return Math.floor(Math.log2(absValue)) + 1;
}

/**
 * Count leading zeros in binary representation
 * @param {import('./BrandedInt8.ts').BrandedInt8} value
 * @returns {number}
 */
export function leadingZeros(value) {
	const unsigned = value < 0 ? value + 256 : value;
	if (unsigned === 0) return 8;
	let count = 0;
	let mask = 0x80;
	while ((unsigned & mask) === 0 && mask > 0) {
		count++;
		mask >>= 1;
	}
	return count;
}

/**
 * Count set bits (population count)
 * @param {import('./BrandedInt8.ts').BrandedInt8} value
 * @returns {number}
 */
export function popCount(value) {
	const unsigned = value < 0 ? value + 256 : value;
	let count = 0;
	let n = unsigned;
	while (n > 0) {
		count += n & 1;
		n >>= 1;
	}
	return count;
}

/**
 * Validate if number is valid Int8
 * @param {number} value
 * @returns {boolean}
 */
export function isValid(value) {
	return Number.isInteger(value) && value >= INT8_MIN && value <= INT8_MAX;
}
