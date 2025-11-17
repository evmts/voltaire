/**
 * Bitwise AND
 * @param {import('./BrandedInt16.ts').BrandedInt16} a
 * @param {import('./BrandedInt16.ts').BrandedInt16} b
 * @returns {import('./BrandedInt16.ts').BrandedInt16}
 */
export function and(a, b) {
	// Convert to unsigned for bitwise ops
	const ua = a < 0 ? a + 65536 : a;
	const ub = b < 0 ? b + 65536 : b;
	const result = ua & ub;
	// Convert back to signed
	const signed = result >= 32768 ? result - 65536 : result;
	return /** @type {import('./BrandedInt16.ts').BrandedInt16} */ (signed);
}

/**
 * Bitwise OR
 * @param {import('./BrandedInt16.ts').BrandedInt16} a
 * @param {import('./BrandedInt16.ts').BrandedInt16} b
 * @returns {import('./BrandedInt16.ts').BrandedInt16}
 */
export function or(a, b) {
	const ua = a < 0 ? a + 65536 : a;
	const ub = b < 0 ? b + 65536 : b;
	const result = ua | ub;
	const signed = result >= 32768 ? result - 65536 : result;
	return /** @type {import('./BrandedInt16.ts').BrandedInt16} */ (signed);
}

/**
 * Bitwise XOR
 * @param {import('./BrandedInt16.ts').BrandedInt16} a
 * @param {import('./BrandedInt16.ts').BrandedInt16} b
 * @returns {import('./BrandedInt16.ts').BrandedInt16}
 */
export function xor(a, b) {
	const ua = a < 0 ? a + 65536 : a;
	const ub = b < 0 ? b + 65536 : b;
	const result = ua ^ ub;
	const signed = result >= 32768 ? result - 65536 : result;
	return /** @type {import('./BrandedInt16.ts').BrandedInt16} */ (signed);
}

/**
 * Bitwise NOT
 * @param {import('./BrandedInt16.ts').BrandedInt16} value
 * @returns {import('./BrandedInt16.ts').BrandedInt16}
 */
export function not(value) {
	const unsigned = value < 0 ? value + 65536 : value;
	const result = ~unsigned & 0xffff;
	const signed = result >= 32768 ? result - 65536 : result;
	return /** @type {import('./BrandedInt16.ts').BrandedInt16} */ (signed);
}

/**
 * Left shift
 * @param {import('./BrandedInt16.ts').BrandedInt16} value
 * @param {number} shift
 * @returns {import('./BrandedInt16.ts').BrandedInt16}
 */
export function shiftLeft(value, shift) {
	if (shift < 0 || shift >= 16) {
		throw new Error(`Int16: shift amount ${shift} out of range [0, 15]`);
	}
	const unsigned = value < 0 ? value + 65536 : value;
	const result = (unsigned << shift) & 0xffff;
	const signed = result >= 32768 ? result - 65536 : result;
	return /** @type {import('./BrandedInt16.ts').BrandedInt16} */ (signed);
}

/**
 * Arithmetic right shift (preserves sign bit)
 * @param {import('./BrandedInt16.ts').BrandedInt16} value
 * @param {number} shift
 * @returns {import('./BrandedInt16.ts').BrandedInt16}
 */
export function shiftRight(value, shift) {
	if (shift < 0 || shift >= 16) {
		throw new Error(`Int16: shift amount ${shift} out of range [0, 15]`);
	}
	// JavaScript >> operator performs arithmetic shift on signed values
	const result = value >> shift;
	return /** @type {import('./BrandedInt16.ts').BrandedInt16} */ (result);
}
