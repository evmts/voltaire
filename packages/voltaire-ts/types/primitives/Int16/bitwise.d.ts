/**
 * Bitwise AND
 * @param {import("./Int16Type.js").BrandedInt16} a
 * @param {import("./Int16Type.js").BrandedInt16} b
 * @returns {import("./Int16Type.js").BrandedInt16}
 */
export function and(a: import("./Int16Type.js").BrandedInt16, b: import("./Int16Type.js").BrandedInt16): import("./Int16Type.js").BrandedInt16;
/**
 * Bitwise OR
 * @param {import("./Int16Type.js").BrandedInt16} a
 * @param {import("./Int16Type.js").BrandedInt16} b
 * @returns {import("./Int16Type.js").BrandedInt16}
 */
export function or(a: import("./Int16Type.js").BrandedInt16, b: import("./Int16Type.js").BrandedInt16): import("./Int16Type.js").BrandedInt16;
/**
 * Bitwise XOR
 * @param {import("./Int16Type.js").BrandedInt16} a
 * @param {import("./Int16Type.js").BrandedInt16} b
 * @returns {import("./Int16Type.js").BrandedInt16}
 */
export function xor(a: import("./Int16Type.js").BrandedInt16, b: import("./Int16Type.js").BrandedInt16): import("./Int16Type.js").BrandedInt16;
/**
 * Bitwise NOT
 * @param {import("./Int16Type.js").BrandedInt16} value
 * @returns {import("./Int16Type.js").BrandedInt16}
 */
export function not(value: import("./Int16Type.js").BrandedInt16): import("./Int16Type.js").BrandedInt16;
/**
 * Left shift
 * @param {import("./Int16Type.js").BrandedInt16} value
 * @param {number} shift
 * @returns {import("./Int16Type.js").BrandedInt16}
 * @throws {InvalidRangeError} If shift amount is out of range [0, 15]
 */
export function shiftLeft(value: import("./Int16Type.js").BrandedInt16, shift: number): import("./Int16Type.js").BrandedInt16;
/**
 * Arithmetic right shift (preserves sign bit)
 * @param {import("./Int16Type.js").BrandedInt16} value
 * @param {number} shift
 * @returns {import("./Int16Type.js").BrandedInt16}
 * @throws {InvalidRangeError} If shift amount is out of range [0, 15]
 */
export function shiftRight(value: import("./Int16Type.js").BrandedInt16, shift: number): import("./Int16Type.js").BrandedInt16;
//# sourceMappingURL=bitwise.d.ts.map