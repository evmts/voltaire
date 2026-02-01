/**
 * Bitwise AND
 * @param {import("./Int8Type.js").BrandedInt8} a
 * @param {import("./Int8Type.js").BrandedInt8} b
 * @returns {import("./Int8Type.js").BrandedInt8}
 */
export function and(a: import("./Int8Type.js").BrandedInt8, b: import("./Int8Type.js").BrandedInt8): import("./Int8Type.js").BrandedInt8;
/**
 * Bitwise OR
 * @param {import("./Int8Type.js").BrandedInt8} a
 * @param {import("./Int8Type.js").BrandedInt8} b
 * @returns {import("./Int8Type.js").BrandedInt8}
 */
export function or(a: import("./Int8Type.js").BrandedInt8, b: import("./Int8Type.js").BrandedInt8): import("./Int8Type.js").BrandedInt8;
/**
 * Bitwise XOR
 * @param {import("./Int8Type.js").BrandedInt8} a
 * @param {import("./Int8Type.js").BrandedInt8} b
 * @returns {import("./Int8Type.js").BrandedInt8}
 */
export function xor(a: import("./Int8Type.js").BrandedInt8, b: import("./Int8Type.js").BrandedInt8): import("./Int8Type.js").BrandedInt8;
/**
 * Bitwise NOT
 * @param {import("./Int8Type.js").BrandedInt8} value
 * @returns {import("./Int8Type.js").BrandedInt8}
 */
export function not(value: import("./Int8Type.js").BrandedInt8): import("./Int8Type.js").BrandedInt8;
/**
 * Left shift
 * @param {import("./Int8Type.js").BrandedInt8} value
 * @param {number} shift
 * @returns {import("./Int8Type.js").BrandedInt8}
 * @throws {InvalidRangeError} If shift amount is out of range [0, 7]
 */
export function shiftLeft(value: import("./Int8Type.js").BrandedInt8, shift: number): import("./Int8Type.js").BrandedInt8;
/**
 * Arithmetic right shift (preserves sign bit)
 * @param {import("./Int8Type.js").BrandedInt8} value
 * @param {number} shift
 * @returns {import("./Int8Type.js").BrandedInt8}
 * @throws {InvalidRangeError} If shift amount is out of range [0, 7]
 */
export function shiftRight(value: import("./Int8Type.js").BrandedInt8, shift: number): import("./Int8Type.js").BrandedInt8;
//# sourceMappingURL=bitwise.d.ts.map