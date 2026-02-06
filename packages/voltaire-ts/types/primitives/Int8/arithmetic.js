import { IntegerOverflowError, IntegerUnderflowError, InvalidRangeError, } from "../errors/index.js";
import { INT8_MAX, INT8_MIN } from "./Int8Type.js";
/**
 * Add two BrandedInt8 values
 * @param {import("./Int8Type.js").BrandedInt8} a
 * @param {import("./Int8Type.js").BrandedInt8} b
 * @returns {import("./Int8Type.js").BrandedInt8}
 * @throws {IntegerOverflowError} If result exceeds INT8_MAX
 * @throws {IntegerUnderflowError} If result is below INT8_MIN
 */
export function plus(a, b) {
    const result = a + b;
    if (result > INT8_MAX) {
        throw new IntegerOverflowError(`Int8: overflow in addition ${a} + ${b} = ${result}`, {
            value: result,
            max: INT8_MAX,
            type: "int8",
            context: { operation: "plus", operands: [a, b] },
        });
    }
    if (result < INT8_MIN) {
        throw new IntegerUnderflowError(`Int8: underflow in addition ${a} + ${b} = ${result}`, {
            value: result,
            min: INT8_MIN,
            type: "int8",
            context: { operation: "plus", operands: [a, b] },
        });
    }
    return /** @type {import("./Int8Type.js").BrandedInt8} */ (result);
}
/**
 * Subtract two BrandedInt8 values
 * @param {import("./Int8Type.js").BrandedInt8} a
 * @param {import("./Int8Type.js").BrandedInt8} b
 * @returns {import("./Int8Type.js").BrandedInt8}
 * @throws {IntegerOverflowError} If result exceeds INT8_MAX
 * @throws {IntegerUnderflowError} If result is below INT8_MIN
 */
export function minus(a, b) {
    const result = a - b;
    if (result > INT8_MAX) {
        throw new IntegerOverflowError(`Int8: overflow in subtraction ${a} - ${b} = ${result}`, {
            value: result,
            max: INT8_MAX,
            type: "int8",
            context: { operation: "minus", operands: [a, b] },
        });
    }
    if (result < INT8_MIN) {
        throw new IntegerUnderflowError(`Int8: underflow in subtraction ${a} - ${b} = ${result}`, {
            value: result,
            min: INT8_MIN,
            type: "int8",
            context: { operation: "minus", operands: [a, b] },
        });
    }
    return /** @type {import("./Int8Type.js").BrandedInt8} */ (result);
}
/**
 * Multiply two BrandedInt8 values
 * @param {import("./Int8Type.js").BrandedInt8} a
 * @param {import("./Int8Type.js").BrandedInt8} b
 * @returns {import("./Int8Type.js").BrandedInt8}
 * @throws {IntegerOverflowError} If result exceeds INT8_MAX
 * @throws {IntegerUnderflowError} If result is below INT8_MIN
 */
export function times(a, b) {
    const result = a * b;
    if (result > INT8_MAX) {
        throw new IntegerOverflowError(`Int8: overflow in multiplication ${a} * ${b} = ${result}`, {
            value: result,
            max: INT8_MAX,
            type: "int8",
            context: { operation: "times", operands: [a, b] },
        });
    }
    if (result < INT8_MIN) {
        throw new IntegerUnderflowError(`Int8: underflow in multiplication ${a} * ${b} = ${result}`, {
            value: result,
            min: INT8_MIN,
            type: "int8",
            context: { operation: "times", operands: [a, b] },
        });
    }
    return /** @type {import("./Int8Type.js").BrandedInt8} */ (result);
}
/**
 * Divide two BrandedInt8 values (EVM SDIV semantics - truncate toward zero)
 * @param {import("./Int8Type.js").BrandedInt8} a
 * @param {import("./Int8Type.js").BrandedInt8} b
 * @returns {import("./Int8Type.js").BrandedInt8}
 * @throws {InvalidRangeError} If divisor is zero
 * @throws {IntegerOverflowError} If INT8_MIN / -1 overflows
 */
export function dividedBy(a, b) {
    if (b === 0) {
        throw new InvalidRangeError("Int8: division by zero", {
            value: b,
            expected: "non-zero divisor",
            docsPath: "/primitives/int8#divided-by",
        });
    }
    // Special case: INT8_MIN / -1 overflows
    if (a === INT8_MIN && b === -1) {
        throw new IntegerOverflowError(`Int8: overflow in division ${INT8_MIN} / -1`, {
            value: -INT8_MIN,
            max: INT8_MAX,
            type: "int8",
            context: { operation: "dividedBy", operands: [a, b] },
        });
    }
    // JavaScript division truncates toward zero for integers
    const result = Math.trunc(a / b);
    return /** @type {import("./Int8Type.js").BrandedInt8} */ (result);
}
/**
 * Modulo operation (EVM SMOD semantics - sign follows dividend)
 * @param {import("./Int8Type.js").BrandedInt8} a
 * @param {import("./Int8Type.js").BrandedInt8} b
 * @returns {import("./Int8Type.js").BrandedInt8}
 * @throws {InvalidRangeError} If divisor is zero
 */
export function modulo(a, b) {
    if (b === 0) {
        throw new InvalidRangeError("Int8: modulo by zero", {
            value: b,
            expected: "non-zero divisor",
            docsPath: "/primitives/int8#modulo",
        });
    }
    // EVM SMOD: sign(a mod b) = sign(a)
    const result = a % b;
    return /** @type {import("./Int8Type.js").BrandedInt8} */ (result);
}
/**
 * Absolute value
 * @param {import("./Int8Type.js").BrandedInt8} value
 * @returns {import("./Int8Type.js").BrandedInt8}
 * @throws {IntegerOverflowError} If abs(INT8_MIN) overflows
 */
export function abs(value) {
    // Special case: abs(INT8_MIN) overflows
    if (value === INT8_MIN) {
        throw new IntegerOverflowError(`Int8: overflow in abs(${INT8_MIN})`, {
            value: -INT8_MIN,
            max: INT8_MAX,
            type: "int8",
            context: { operation: "abs" },
        });
    }
    const result = Math.abs(value);
    return /** @type {import("./Int8Type.js").BrandedInt8} */ (result);
}
/**
 * Negate value
 * @param {import("./Int8Type.js").BrandedInt8} value
 * @returns {import("./Int8Type.js").BrandedInt8}
 * @throws {IntegerOverflowError} If negation of INT8_MIN overflows
 */
export function negate(value) {
    // Special case: -INT8_MIN overflows
    if (value === INT8_MIN) {
        throw new IntegerOverflowError(`Int8: overflow in negation -${INT8_MIN}`, {
            value: -INT8_MIN,
            max: INT8_MAX,
            type: "int8",
            context: { operation: "negate" },
        });
    }
    // Special case: avoid -0
    if (value === 0) {
        return /** @type {import("./Int8Type.js").BrandedInt8} */ (0);
    }
    const result = -value;
    return /** @type {import("./Int8Type.js").BrandedInt8} */ (result);
}
