/**
 * Add two BrandedInt8 values
 * @param {import("./Int8Type.js").BrandedInt8} a
 * @param {import("./Int8Type.js").BrandedInt8} b
 * @returns {import("./Int8Type.js").BrandedInt8}
 * @throws {IntegerOverflowError} If result exceeds INT8_MAX
 * @throws {IntegerUnderflowError} If result is below INT8_MIN
 */
export function plus(a: import("./Int8Type.js").BrandedInt8, b: import("./Int8Type.js").BrandedInt8): import("./Int8Type.js").BrandedInt8;
/**
 * Subtract two BrandedInt8 values
 * @param {import("./Int8Type.js").BrandedInt8} a
 * @param {import("./Int8Type.js").BrandedInt8} b
 * @returns {import("./Int8Type.js").BrandedInt8}
 * @throws {IntegerOverflowError} If result exceeds INT8_MAX
 * @throws {IntegerUnderflowError} If result is below INT8_MIN
 */
export function minus(a: import("./Int8Type.js").BrandedInt8, b: import("./Int8Type.js").BrandedInt8): import("./Int8Type.js").BrandedInt8;
/**
 * Multiply two BrandedInt8 values
 * @param {import("./Int8Type.js").BrandedInt8} a
 * @param {import("./Int8Type.js").BrandedInt8} b
 * @returns {import("./Int8Type.js").BrandedInt8}
 * @throws {IntegerOverflowError} If result exceeds INT8_MAX
 * @throws {IntegerUnderflowError} If result is below INT8_MIN
 */
export function times(a: import("./Int8Type.js").BrandedInt8, b: import("./Int8Type.js").BrandedInt8): import("./Int8Type.js").BrandedInt8;
/**
 * Divide two BrandedInt8 values (EVM SDIV semantics - truncate toward zero)
 * @param {import("./Int8Type.js").BrandedInt8} a
 * @param {import("./Int8Type.js").BrandedInt8} b
 * @returns {import("./Int8Type.js").BrandedInt8}
 * @throws {InvalidRangeError} If divisor is zero
 * @throws {IntegerOverflowError} If INT8_MIN / -1 overflows
 */
export function dividedBy(a: import("./Int8Type.js").BrandedInt8, b: import("./Int8Type.js").BrandedInt8): import("./Int8Type.js").BrandedInt8;
/**
 * Modulo operation (EVM SMOD semantics - sign follows dividend)
 * @param {import("./Int8Type.js").BrandedInt8} a
 * @param {import("./Int8Type.js").BrandedInt8} b
 * @returns {import("./Int8Type.js").BrandedInt8}
 * @throws {InvalidRangeError} If divisor is zero
 */
export function modulo(a: import("./Int8Type.js").BrandedInt8, b: import("./Int8Type.js").BrandedInt8): import("./Int8Type.js").BrandedInt8;
/**
 * Absolute value
 * @param {import("./Int8Type.js").BrandedInt8} value
 * @returns {import("./Int8Type.js").BrandedInt8}
 * @throws {IntegerOverflowError} If abs(INT8_MIN) overflows
 */
export function abs(value: import("./Int8Type.js").BrandedInt8): import("./Int8Type.js").BrandedInt8;
/**
 * Negate value
 * @param {import("./Int8Type.js").BrandedInt8} value
 * @returns {import("./Int8Type.js").BrandedInt8}
 * @throws {IntegerOverflowError} If negation of INT8_MIN overflows
 */
export function negate(value: import("./Int8Type.js").BrandedInt8): import("./Int8Type.js").BrandedInt8;
//# sourceMappingURL=arithmetic.d.ts.map