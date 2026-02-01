import { IntegerOverflowError, IntegerUnderflowError, InvalidRangeError, } from "../errors/index.js";
import { INT16_MAX, INT16_MIN } from "./Int16Type.js";
/**
 * Add two BrandedInt16 values
 * @param {import("./Int16Type.js").BrandedInt16} a
 * @param {import("./Int16Type.js").BrandedInt16} b
 * @returns {import("./Int16Type.js").BrandedInt16}
 * @throws {IntegerOverflowError} If result exceeds INT16_MAX
 * @throws {IntegerUnderflowError} If result is below INT16_MIN
 */
export function plus(a, b) {
    const result = a + b;
    if (result > INT16_MAX) {
        throw new IntegerOverflowError(`Int16: overflow in addition ${a} + ${b} = ${result}`, {
            value: result,
            max: INT16_MAX,
            type: "int16",
            context: { operation: "plus", operands: [a, b] },
        });
    }
    if (result < INT16_MIN) {
        throw new IntegerUnderflowError(`Int16: underflow in addition ${a} + ${b} = ${result}`, {
            value: result,
            min: INT16_MIN,
            type: "int16",
            context: { operation: "plus", operands: [a, b] },
        });
    }
    return /** @type {import("./Int16Type.js").BrandedInt16} */ (result);
}
/**
 * Subtract two BrandedInt16 values
 * @param {import("./Int16Type.js").BrandedInt16} a
 * @param {import("./Int16Type.js").BrandedInt16} b
 * @returns {import("./Int16Type.js").BrandedInt16}
 * @throws {IntegerOverflowError} If result exceeds INT16_MAX
 * @throws {IntegerUnderflowError} If result is below INT16_MIN
 */
export function minus(a, b) {
    const result = a - b;
    if (result > INT16_MAX) {
        throw new IntegerOverflowError(`Int16: overflow in subtraction ${a} - ${b} = ${result}`, {
            value: result,
            max: INT16_MAX,
            type: "int16",
            context: { operation: "minus", operands: [a, b] },
        });
    }
    if (result < INT16_MIN) {
        throw new IntegerUnderflowError(`Int16: underflow in subtraction ${a} - ${b} = ${result}`, {
            value: result,
            min: INT16_MIN,
            type: "int16",
            context: { operation: "minus", operands: [a, b] },
        });
    }
    return /** @type {import("./Int16Type.js").BrandedInt16} */ (result);
}
/**
 * Multiply two BrandedInt16 values
 * @param {import("./Int16Type.js").BrandedInt16} a
 * @param {import("./Int16Type.js").BrandedInt16} b
 * @returns {import("./Int16Type.js").BrandedInt16}
 * @throws {IntegerOverflowError} If result exceeds INT16_MAX
 * @throws {IntegerUnderflowError} If result is below INT16_MIN
 */
export function times(a, b) {
    const result = a * b;
    if (result > INT16_MAX) {
        throw new IntegerOverflowError(`Int16: overflow in multiplication ${a} * ${b} = ${result}`, {
            value: result,
            max: INT16_MAX,
            type: "int16",
            context: { operation: "times", operands: [a, b] },
        });
    }
    if (result < INT16_MIN) {
        throw new IntegerUnderflowError(`Int16: underflow in multiplication ${a} * ${b} = ${result}`, {
            value: result,
            min: INT16_MIN,
            type: "int16",
            context: { operation: "times", operands: [a, b] },
        });
    }
    return /** @type {import("./Int16Type.js").BrandedInt16} */ (result);
}
/**
 * Divide two BrandedInt16 values (EVM SDIV semantics - truncate toward zero)
 * @param {import("./Int16Type.js").BrandedInt16} a
 * @param {import("./Int16Type.js").BrandedInt16} b
 * @returns {import("./Int16Type.js").BrandedInt16}
 * @throws {InvalidRangeError} If divisor is zero
 * @throws {IntegerOverflowError} If INT16_MIN / -1 overflows
 */
export function dividedBy(a, b) {
    if (b === 0) {
        throw new InvalidRangeError("Int16: division by zero", {
            value: b,
            expected: "non-zero divisor",
            docsPath: "/primitives/int16#divided-by",
        });
    }
    // Special case: INT16_MIN / -1 overflows
    if (a === INT16_MIN && b === -1) {
        throw new IntegerOverflowError(`Int16: overflow in division ${INT16_MIN} / -1`, {
            value: -INT16_MIN,
            max: INT16_MAX,
            type: "int16",
            context: { operation: "dividedBy", operands: [a, b] },
        });
    }
    // JavaScript division truncates toward zero for integers
    const result = Math.trunc(a / b);
    return /** @type {import("./Int16Type.js").BrandedInt16} */ (result);
}
/**
 * Modulo operation (EVM SMOD semantics - sign follows dividend)
 * @param {import("./Int16Type.js").BrandedInt16} a
 * @param {import("./Int16Type.js").BrandedInt16} b
 * @returns {import("./Int16Type.js").BrandedInt16}
 * @throws {InvalidRangeError} If divisor is zero
 */
export function modulo(a, b) {
    if (b === 0) {
        throw new InvalidRangeError("Int16: modulo by zero", {
            value: b,
            expected: "non-zero divisor",
            docsPath: "/primitives/int16#modulo",
        });
    }
    // EVM SMOD: sign(a mod b) = sign(a)
    const result = a % b;
    return /** @type {import("./Int16Type.js").BrandedInt16} */ (result);
}
/**
 * Absolute value
 * @param {import("./Int16Type.js").BrandedInt16} value
 * @returns {import("./Int16Type.js").BrandedInt16}
 * @throws {IntegerOverflowError} If abs(INT16_MIN) overflows
 */
export function abs(value) {
    // Special case: abs(INT16_MIN) overflows
    if (value === INT16_MIN) {
        throw new IntegerOverflowError(`Int16: overflow in abs(${INT16_MIN})`, {
            value: -INT16_MIN,
            max: INT16_MAX,
            type: "int16",
            context: { operation: "abs" },
        });
    }
    const result = Math.abs(value);
    return /** @type {import("./Int16Type.js").BrandedInt16} */ (result);
}
/**
 * Negate value
 * @param {import("./Int16Type.js").BrandedInt16} value
 * @returns {import("./Int16Type.js").BrandedInt16}
 * @throws {IntegerOverflowError} If negation of INT16_MIN overflows
 */
export function negate(value) {
    // Special case: -INT16_MIN overflows
    if (value === INT16_MIN) {
        throw new IntegerOverflowError(`Int16: overflow in negation -${INT16_MIN}`, {
            value: -INT16_MIN,
            max: INT16_MAX,
            type: "int16",
            context: { operation: "negate" },
        });
    }
    // Special case: avoid -0
    if (value === 0) {
        return /** @type {import("./Int16Type.js").BrandedInt16} */ (0);
    }
    const result = -value;
    return /** @type {import("./Int16Type.js").BrandedInt16} */ (result);
}
