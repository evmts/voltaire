import { InvalidRangeError } from "../errors/index.js";
/**
 * Assert value is strictly positive (> 0)
 *
 * @param {number | bigint} value - Value to check
 * @param {string} [name='value'] - Name for error messages
 * @throws {InvalidRangeError} If value <= 0
 * @example
 * ```javascript
 * assertPositive(1, 'gasLimit');    // OK
 * assertPositive(0, 'gasLimit');    // throws
 * assertPositive(-1, 'gasLimit');   // throws
 * ```
 */
export function assertPositive(value, name = "value") {
    const zero = typeof value === "bigint" ? 0n : 0;
    if (value <= zero) {
        throw new InvalidRangeError(`${name} must be positive`, {
            code: -32602,
            value,
            expected: `${name} > 0`,
            docsPath: "/primitives/validation#assert-positive",
        });
    }
}
/**
 * Assert value is non-negative (>= 0)
 *
 * @param {number | bigint} value - Value to check
 * @param {string} [name='value'] - Name for error messages
 * @throws {InvalidRangeError} If value < 0
 * @example
 * ```javascript
 * assertNonNegative(0, 'nonce');    // OK
 * assertNonNegative(100, 'nonce');  // OK
 * assertNonNegative(-1, 'nonce');   // throws
 * ```
 */
export function assertNonNegative(value, name = "value") {
    const zero = typeof value === "bigint" ? 0n : 0;
    if (value < zero) {
        throw new InvalidRangeError(`${name} cannot be negative`, {
            code: -32602,
            value,
            expected: `${name} >= 0`,
            docsPath: "/primitives/validation#assert-non-negative",
        });
    }
}
/**
 * Assert value is not zero
 *
 * @param {number | bigint} value - Value to check
 * @param {string} [name='value'] - Name for error messages
 * @throws {InvalidRangeError} If value === 0
 * @example
 * ```javascript
 * assertNonZero(1, 'chainId');      // OK
 * assertNonZero(-1, 'divisor');     // OK
 * assertNonZero(0, 'chainId');      // throws
 * ```
 */
export function assertNonZero(value, name = "value") {
    const zero = typeof value === "bigint" ? 0n : 0;
    if (value === zero) {
        throw new InvalidRangeError(`${name} cannot be zero`, {
            code: -32602,
            value,
            expected: `${name} !== 0`,
            docsPath: "/primitives/validation#assert-non-zero",
        });
    }
}
