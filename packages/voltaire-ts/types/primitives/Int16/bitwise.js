import { InvalidRangeError } from "../errors/index.js";
/**
 * Bitwise AND
 * @param {import("./Int16Type.js").BrandedInt16} a
 * @param {import("./Int16Type.js").BrandedInt16} b
 * @returns {import("./Int16Type.js").BrandedInt16}
 */
export function and(a, b) {
    // Convert to unsigned for bitwise ops
    const ua = a < 0 ? a + 65536 : a;
    const ub = b < 0 ? b + 65536 : b;
    const result = ua & ub;
    // Convert back to signed
    const signed = result >= 32768 ? result - 65536 : result;
    return /** @type {import("./Int16Type.js").BrandedInt16} */ (signed);
}
/**
 * Bitwise OR
 * @param {import("./Int16Type.js").BrandedInt16} a
 * @param {import("./Int16Type.js").BrandedInt16} b
 * @returns {import("./Int16Type.js").BrandedInt16}
 */
export function or(a, b) {
    const ua = a < 0 ? a + 65536 : a;
    const ub = b < 0 ? b + 65536 : b;
    const result = ua | ub;
    const signed = result >= 32768 ? result - 65536 : result;
    return /** @type {import("./Int16Type.js").BrandedInt16} */ (signed);
}
/**
 * Bitwise XOR
 * @param {import("./Int16Type.js").BrandedInt16} a
 * @param {import("./Int16Type.js").BrandedInt16} b
 * @returns {import("./Int16Type.js").BrandedInt16}
 */
export function xor(a, b) {
    const ua = a < 0 ? a + 65536 : a;
    const ub = b < 0 ? b + 65536 : b;
    const result = ua ^ ub;
    const signed = result >= 32768 ? result - 65536 : result;
    return /** @type {import("./Int16Type.js").BrandedInt16} */ (signed);
}
/**
 * Bitwise NOT
 * @param {import("./Int16Type.js").BrandedInt16} value
 * @returns {import("./Int16Type.js").BrandedInt16}
 */
export function not(value) {
    const unsigned = value < 0 ? value + 65536 : value;
    const result = ~unsigned & 0xffff;
    const signed = result >= 32768 ? result - 65536 : result;
    return /** @type {import("./Int16Type.js").BrandedInt16} */ (signed);
}
/**
 * Left shift
 * @param {import("./Int16Type.js").BrandedInt16} value
 * @param {number} shift
 * @returns {import("./Int16Type.js").BrandedInt16}
 * @throws {InvalidRangeError} If shift amount is out of range [0, 15]
 */
export function shiftLeft(value, shift) {
    if (shift < 0 || shift >= 16) {
        throw new InvalidRangeError(`Int16: shift amount ${shift} out of range [0, 15]`, {
            value: shift,
            expected: "0-15",
            docsPath: "/primitives/int16#shift-left",
        });
    }
    const unsigned = value < 0 ? value + 65536 : value;
    const result = (unsigned << shift) & 0xffff;
    const signed = result >= 32768 ? result - 65536 : result;
    return /** @type {import("./Int16Type.js").BrandedInt16} */ (signed);
}
/**
 * Arithmetic right shift (preserves sign bit)
 * @param {import("./Int16Type.js").BrandedInt16} value
 * @param {number} shift
 * @returns {import("./Int16Type.js").BrandedInt16}
 * @throws {InvalidRangeError} If shift amount is out of range [0, 15]
 */
export function shiftRight(value, shift) {
    if (shift < 0 || shift >= 16) {
        throw new InvalidRangeError(`Int16: shift amount ${shift} out of range [0, 15]`, {
            value: shift,
            expected: "0-15",
            docsPath: "/primitives/int16#shift-right",
        });
    }
    // JavaScript >> operator performs arithmetic shift on signed values
    const result = value >> shift;
    return /** @type {import("./Int16Type.js").BrandedInt16} */ (result);
}
