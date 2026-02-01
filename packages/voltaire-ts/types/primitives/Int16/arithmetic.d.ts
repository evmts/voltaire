/**
 * Add two BrandedInt16 values
 * @param {import("./Int16Type.js").BrandedInt16} a
 * @param {import("./Int16Type.js").BrandedInt16} b
 * @returns {import("./Int16Type.js").BrandedInt16}
 * @throws {IntegerOverflowError} If result exceeds INT16_MAX
 * @throws {IntegerUnderflowError} If result is below INT16_MIN
 */
export function plus(a: import("./Int16Type.js").BrandedInt16, b: import("./Int16Type.js").BrandedInt16): import("./Int16Type.js").BrandedInt16;
/**
 * Subtract two BrandedInt16 values
 * @param {import("./Int16Type.js").BrandedInt16} a
 * @param {import("./Int16Type.js").BrandedInt16} b
 * @returns {import("./Int16Type.js").BrandedInt16}
 * @throws {IntegerOverflowError} If result exceeds INT16_MAX
 * @throws {IntegerUnderflowError} If result is below INT16_MIN
 */
export function minus(a: import("./Int16Type.js").BrandedInt16, b: import("./Int16Type.js").BrandedInt16): import("./Int16Type.js").BrandedInt16;
/**
 * Multiply two BrandedInt16 values
 * @param {import("./Int16Type.js").BrandedInt16} a
 * @param {import("./Int16Type.js").BrandedInt16} b
 * @returns {import("./Int16Type.js").BrandedInt16}
 * @throws {IntegerOverflowError} If result exceeds INT16_MAX
 * @throws {IntegerUnderflowError} If result is below INT16_MIN
 */
export function times(a: import("./Int16Type.js").BrandedInt16, b: import("./Int16Type.js").BrandedInt16): import("./Int16Type.js").BrandedInt16;
/**
 * Divide two BrandedInt16 values (EVM SDIV semantics - truncate toward zero)
 * @param {import("./Int16Type.js").BrandedInt16} a
 * @param {import("./Int16Type.js").BrandedInt16} b
 * @returns {import("./Int16Type.js").BrandedInt16}
 * @throws {InvalidRangeError} If divisor is zero
 * @throws {IntegerOverflowError} If INT16_MIN / -1 overflows
 */
export function dividedBy(a: import("./Int16Type.js").BrandedInt16, b: import("./Int16Type.js").BrandedInt16): import("./Int16Type.js").BrandedInt16;
/**
 * Modulo operation (EVM SMOD semantics - sign follows dividend)
 * @param {import("./Int16Type.js").BrandedInt16} a
 * @param {import("./Int16Type.js").BrandedInt16} b
 * @returns {import("./Int16Type.js").BrandedInt16}
 * @throws {InvalidRangeError} If divisor is zero
 */
export function modulo(a: import("./Int16Type.js").BrandedInt16, b: import("./Int16Type.js").BrandedInt16): import("./Int16Type.js").BrandedInt16;
/**
 * Absolute value
 * @param {import("./Int16Type.js").BrandedInt16} value
 * @returns {import("./Int16Type.js").BrandedInt16}
 * @throws {IntegerOverflowError} If abs(INT16_MIN) overflows
 */
export function abs(value: import("./Int16Type.js").BrandedInt16): import("./Int16Type.js").BrandedInt16;
/**
 * Negate value
 * @param {import("./Int16Type.js").BrandedInt16} value
 * @returns {import("./Int16Type.js").BrandedInt16}
 * @throws {IntegerOverflowError} If negation of INT16_MIN overflows
 */
export function negate(value: import("./Int16Type.js").BrandedInt16): import("./Int16Type.js").BrandedInt16;
//# sourceMappingURL=arithmetic.d.ts.map