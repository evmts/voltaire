import { InvalidRangeError } from "../errors/index.js";

/**
 * Bitwise AND
 * @param {import("./Int8Type.js").BrandedInt8} a
 * @param {import("./Int8Type.js").BrandedInt8} b
 * @returns {import("./Int8Type.js").BrandedInt8}
 */
export function and(a, b) {
	// Convert to unsigned for bitwise ops
	const ua = a < 0 ? a + 256 : a;
	const ub = b < 0 ? b + 256 : b;
	const result = ua & ub;
	// Convert back to signed
	const signed = result >= 128 ? result - 256 : result;
	return /** @type {import("./Int8Type.js").BrandedInt8} */ (signed);
}

/**
 * Bitwise OR
 * @param {import("./Int8Type.js").BrandedInt8} a
 * @param {import("./Int8Type.js").BrandedInt8} b
 * @returns {import("./Int8Type.js").BrandedInt8}
 */
export function or(a, b) {
	const ua = a < 0 ? a + 256 : a;
	const ub = b < 0 ? b + 256 : b;
	const result = ua | ub;
	const signed = result >= 128 ? result - 256 : result;
	return /** @type {import("./Int8Type.js").BrandedInt8} */ (signed);
}

/**
 * Bitwise XOR
 * @param {import("./Int8Type.js").BrandedInt8} a
 * @param {import("./Int8Type.js").BrandedInt8} b
 * @returns {import("./Int8Type.js").BrandedInt8}
 */
export function xor(a, b) {
	const ua = a < 0 ? a + 256 : a;
	const ub = b < 0 ? b + 256 : b;
	const result = ua ^ ub;
	const signed = result >= 128 ? result - 256 : result;
	return /** @type {import("./Int8Type.js").BrandedInt8} */ (signed);
}

/**
 * Bitwise NOT
 * @param {import("./Int8Type.js").BrandedInt8} value
 * @returns {import("./Int8Type.js").BrandedInt8}
 */
export function not(value) {
	const unsigned = value < 0 ? value + 256 : value;
	const result = ~unsigned & 0xff;
	const signed = result >= 128 ? result - 256 : result;
	return /** @type {import("./Int8Type.js").BrandedInt8} */ (signed);
}

/**
 * Left shift
 * @param {import("./Int8Type.js").BrandedInt8} value
 * @param {number} shift
 * @returns {import("./Int8Type.js").BrandedInt8}
 * @throws {InvalidRangeError} If shift amount is out of range [0, 7]
 */
export function shiftLeft(value, shift) {
	if (shift < 0 || shift >= 8) {
		throw new InvalidRangeError(`Int8: shift amount ${shift} out of range [0, 7]`, {
			value: shift,
			expected: "0-7",
			docsPath: "/primitives/int8#shift-left",
		});
	}
	const unsigned = value < 0 ? value + 256 : value;
	const result = (unsigned << shift) & 0xff;
	const signed = result >= 128 ? result - 256 : result;
	return /** @type {import("./Int8Type.js").BrandedInt8} */ (signed);
}

/**
 * Arithmetic right shift (preserves sign bit)
 * @param {import("./Int8Type.js").BrandedInt8} value
 * @param {number} shift
 * @returns {import("./Int8Type.js").BrandedInt8}
 * @throws {InvalidRangeError} If shift amount is out of range [0, 7]
 */
export function shiftRight(value, shift) {
	if (shift < 0 || shift >= 8) {
		throw new InvalidRangeError(`Int8: shift amount ${shift} out of range [0, 7]`, {
			value: shift,
			expected: "0-7",
			docsPath: "/primitives/int8#shift-right",
		});
	}
	// JavaScript >> operator performs arithmetic shift on signed values
	const result = value >> shift;
	return /** @type {import("./Int8Type.js").BrandedInt8} */ (result);
}
