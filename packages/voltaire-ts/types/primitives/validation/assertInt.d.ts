/**
 * Assert value is valid int8 (-128 to 127)
 *
 * @param {number} value - Value to check
 * @param {string} [name='int8'] - Name for error messages
 * @throws {IntegerUnderflowError} If value < -128
 * @throws {IntegerOverflowError} If value > 127
 * @example
 * ```javascript
 * assertInt8(100);      // OK
 * assertInt8(-100);     // OK
 * assertInt8(128);      // throws IntegerOverflowError
 * assertInt8(-129);     // throws IntegerUnderflowError
 * ```
 */
export function assertInt8(value: number, name?: string): void;
/**
 * Assert value is valid int16 (-32768 to 32767)
 *
 * @param {number} value - Value to check
 * @param {string} [name='int16'] - Name for error messages
 * @throws {IntegerUnderflowError} If value < -32768
 * @throws {IntegerOverflowError} If value > 32767
 */
export function assertInt16(value: number, name?: string): void;
/**
 * Assert value is valid int32 (-2147483648 to 2147483647)
 *
 * @param {number} value - Value to check
 * @param {string} [name='int32'] - Name for error messages
 * @throws {IntegerUnderflowError} If value < -2147483648
 * @throws {IntegerOverflowError} If value > 2147483647
 */
export function assertInt32(value: number, name?: string): void;
/**
 * Assert value is valid int64 (-2^63 to 2^63-1)
 *
 * @param {bigint} value - Value to check
 * @param {string} [name='int64'] - Name for error messages
 * @throws {IntegerUnderflowError} If value < -2^63
 * @throws {IntegerOverflowError} If value > 2^63-1
 */
export function assertInt64(value: bigint, name?: string): void;
/**
 * Assert value is valid int128 (-2^127 to 2^127-1)
 *
 * @param {bigint} value - Value to check
 * @param {string} [name='int128'] - Name for error messages
 * @throws {IntegerUnderflowError} If value < -2^127
 * @throws {IntegerOverflowError} If value > 2^127-1
 */
export function assertInt128(value: bigint, name?: string): void;
/**
 * Assert value is valid int256 (-2^255 to 2^255-1)
 *
 * @param {bigint} value - Value to check
 * @param {string} [name='int256'] - Name for error messages
 * @throws {IntegerUnderflowError} If value < -2^255
 * @throws {IntegerOverflowError} If value > 2^255-1
 */
export function assertInt256(value: bigint, name?: string): void;
//# sourceMappingURL=assertInt.d.ts.map