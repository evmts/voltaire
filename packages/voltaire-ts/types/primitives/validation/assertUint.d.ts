/**
 * Assert value is valid uint8 (0-255)
 *
 * @param {number} value - Value to check
 * @param {string} [name='uint8'] - Name for error messages
 * @throws {IntegerUnderflowError} If value < 0
 * @throws {IntegerOverflowError} If value > 255
 * @example
 * ```javascript
 * assertUint8(100);     // OK
 * assertUint8(256);     // throws IntegerOverflowError
 * assertUint8(-1);      // throws IntegerUnderflowError
 * ```
 */
export function assertUint8(value: number, name?: string): void;
/**
 * Assert value is valid uint16 (0-65535)
 *
 * @param {number} value - Value to check
 * @param {string} [name='uint16'] - Name for error messages
 * @throws {IntegerUnderflowError} If value < 0
 * @throws {IntegerOverflowError} If value > 65535
 */
export function assertUint16(value: number, name?: string): void;
/**
 * Assert value is valid uint32 (0-4294967295)
 *
 * @param {number} value - Value to check
 * @param {string} [name='uint32'] - Name for error messages
 * @throws {IntegerUnderflowError} If value < 0
 * @throws {IntegerOverflowError} If value > 4294967295
 */
export function assertUint32(value: number, name?: string): void;
/**
 * Assert value is valid uint64 (0 to 2^64-1)
 *
 * @param {bigint} value - Value to check
 * @param {string} [name='uint64'] - Name for error messages
 * @throws {IntegerUnderflowError} If value < 0
 * @throws {IntegerOverflowError} If value > 2^64-1
 */
export function assertUint64(value: bigint, name?: string): void;
/**
 * Assert value is valid uint128 (0 to 2^128-1)
 *
 * @param {bigint} value - Value to check
 * @param {string} [name='uint128'] - Name for error messages
 * @throws {IntegerUnderflowError} If value < 0
 * @throws {IntegerOverflowError} If value > 2^128-1
 */
export function assertUint128(value: bigint, name?: string): void;
/**
 * Assert value is valid uint256 (0 to 2^256-1)
 *
 * @param {bigint} value - Value to check
 * @param {string} [name='uint256'] - Name for error messages
 * @throws {IntegerUnderflowError} If value < 0
 * @throws {IntegerOverflowError} If value > 2^256-1
 */
export function assertUint256(value: bigint, name?: string): void;
//# sourceMappingURL=assertUint.d.ts.map