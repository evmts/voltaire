/**
 * Check if two BrandedInt8 values are equal
 * @param {import('./BrandedInt8.ts').BrandedInt8} a
 * @param {import('./BrandedInt8.ts').BrandedInt8} b
 * @returns {boolean}
 */
export function equals(a, b) {
	return a === b;
}

/**
 * Check if a < b
 * @param {import('./BrandedInt8.ts').BrandedInt8} a
 * @param {import('./BrandedInt8.ts').BrandedInt8} b
 * @returns {boolean}
 */
export function lessThan(a, b) {
	return a < b;
}

/**
 * Check if a > b
 * @param {import('./BrandedInt8.ts').BrandedInt8} a
 * @param {import('./BrandedInt8.ts').BrandedInt8} b
 * @returns {boolean}
 */
export function greaterThan(a, b) {
	return a > b;
}

/**
 * Check if value is zero
 * @param {import('./BrandedInt8.ts').BrandedInt8} value
 * @returns {boolean}
 */
export function isZero(value) {
	return value === 0;
}

/**
 * Check if value is negative
 * @param {import('./BrandedInt8.ts').BrandedInt8} value
 * @returns {boolean}
 */
export function isNegative(value) {
	return value < 0;
}

/**
 * Check if value is positive (> 0)
 * @param {import('./BrandedInt8.ts').BrandedInt8} value
 * @returns {boolean}
 */
export function isPositive(value) {
	return value > 0;
}

/**
 * Get minimum of two values
 * @param {import('./BrandedInt8.ts').BrandedInt8} a
 * @param {import('./BrandedInt8.ts').BrandedInt8} b
 * @returns {import('./BrandedInt8.ts').BrandedInt8}
 */
export function minimum(a, b) {
	return /** @type {import('./BrandedInt8.ts').BrandedInt8} */ (
		Math.min(a, b)
	);
}

/**
 * Get maximum of two values
 * @param {import('./BrandedInt8.ts').BrandedInt8} a
 * @param {import('./BrandedInt8.ts').BrandedInt8} b
 * @returns {import('./BrandedInt8.ts').BrandedInt8}
 */
export function maximum(a, b) {
	return /** @type {import('./BrandedInt8.ts').BrandedInt8} */ (
		Math.max(a, b)
	);
}

/**
 * Get sign of value (-1, 0, or 1)
 * @param {import('./BrandedInt8.ts').BrandedInt8} value
 * @returns {-1 | 0 | 1}
 */
export function sign(value) {
	if (value < 0) return -1;
	if (value > 0) return 1;
	return 0;
}
