/**
 * Bitwise AND
 * @param {import('./BrandedInt8.ts').BrandedInt8} a
 * @param {import('./BrandedInt8.ts').BrandedInt8} b
 * @returns {import('./BrandedInt8.ts').BrandedInt8}
 */
export function and(a, b) {
	// Convert to unsigned for bitwise ops
	const ua = a < 0 ? a + 256 : a;
	const ub = b < 0 ? b + 256 : b;
	const result = ua & ub;
	// Convert back to signed
	const signed = result >= 128 ? result - 256 : result;
	return /** @type {import('./BrandedInt8.ts').BrandedInt8} */ (signed);
}

/**
 * Bitwise OR
 * @param {import('./BrandedInt8.ts').BrandedInt8} a
 * @param {import('./BrandedInt8.ts').BrandedInt8} b
 * @returns {import('./BrandedInt8.ts').BrandedInt8}
 */
export function or(a, b) {
	const ua = a < 0 ? a + 256 : a;
	const ub = b < 0 ? b + 256 : b;
	const result = ua | ub;
	const signed = result >= 128 ? result - 256 : result;
	return /** @type {import('./BrandedInt8.ts').BrandedInt8} */ (signed);
}

/**
 * Bitwise XOR
 * @param {import('./BrandedInt8.ts').BrandedInt8} a
 * @param {import('./BrandedInt8.ts').BrandedInt8} b
 * @returns {import('./BrandedInt8.ts').BrandedInt8}
 */
export function xor(a, b) {
	const ua = a < 0 ? a + 256 : a;
	const ub = b < 0 ? b + 256 : b;
	const result = ua ^ ub;
	const signed = result >= 128 ? result - 256 : result;
	return /** @type {import('./BrandedInt8.ts').BrandedInt8} */ (signed);
}

/**
 * Bitwise NOT
 * @param {import('./BrandedInt8.ts').BrandedInt8} value
 * @returns {import('./BrandedInt8.ts').BrandedInt8}
 */
export function not(value) {
	const unsigned = value < 0 ? value + 256 : value;
	const result = (~unsigned) & 0xff;
	const signed = result >= 128 ? result - 256 : result;
	return /** @type {import('./BrandedInt8.ts').BrandedInt8} */ (signed);
}

/**
 * Left shift
 * @param {import('./BrandedInt8.ts').BrandedInt8} value
 * @param {number} shift
 * @returns {import('./BrandedInt8.ts').BrandedInt8}
 */
export function shiftLeft(value, shift) {
	if (shift < 0 || shift >= 8) {
		throw new Error(`Int8: shift amount ${shift} out of range [0, 7]`);
	}
	const unsigned = value < 0 ? value + 256 : value;
	const result = (unsigned << shift) & 0xff;
	const signed = result >= 128 ? result - 256 : result;
	return /** @type {import('./BrandedInt8.ts').BrandedInt8} */ (signed);
}

/**
 * Arithmetic right shift (preserves sign bit)
 * @param {import('./BrandedInt8.ts').BrandedInt8} value
 * @param {number} shift
 * @returns {import('./BrandedInt8.ts').BrandedInt8}
 */
export function shiftRight(value, shift) {
	if (shift < 0 || shift >= 8) {
		throw new Error(`Int8: shift amount ${shift} out of range [0, 7]`);
	}
	// JavaScript >> operator performs arithmetic shift on signed values
	const result = value >> shift;
	return /** @type {import('./BrandedInt8.ts').BrandedInt8} */ (result);
}
