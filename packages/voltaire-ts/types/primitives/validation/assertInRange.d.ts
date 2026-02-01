/**
 * Assert a number value is within specified range
 *
 * @param {number} value - Value to check
 * @param {number} min - Minimum allowed value (inclusive)
 * @param {number} max - Maximum allowed value (inclusive)
 * @param {string} name - Name for error messages (e.g., 'gas', 'nonce')
 * @throws {IntegerUnderflowError} If value < min
 * @throws {IntegerOverflowError} If value > max
 * @example
 * ```javascript
 * assertInRange(100, 0, 255, 'uint8'); // OK
 * assertInRange(256, 0, 255, 'uint8'); // throws IntegerOverflowError
 * assertInRange(-1, 0, 255, 'uint8');  // throws IntegerUnderflowError
 * ```
 */
export function assertInRange(value: number, min: number, max: number, name: string): void;
/**
 * Assert a bigint value is within specified range
 *
 * @param {bigint} value - Value to check
 * @param {bigint} min - Minimum allowed value (inclusive)
 * @param {bigint} max - Maximum allowed value (inclusive)
 * @param {string} name - Name for error messages (e.g., 'uint256', 'int128')
 * @throws {IntegerUnderflowError} If value < min
 * @throws {IntegerOverflowError} If value > max
 * @example
 * ```javascript
 * assertInRangeBigInt(100n, 0n, 2n ** 256n - 1n, 'uint256'); // OK
 * assertInRangeBigInt(-1n, 0n, 2n ** 256n - 1n, 'uint256');  // throws
 * ```
 */
export function assertInRangeBigInt(value: bigint, min: bigint, max: bigint, name: string): void;
//# sourceMappingURL=assertInRange.d.ts.map