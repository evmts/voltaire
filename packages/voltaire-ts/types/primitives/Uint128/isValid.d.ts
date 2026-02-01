/**
 * Check if value is valid Uint128
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {bigint | number | string} value - Value to check
 * @returns {boolean} True if valid
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * Uint128.isValid(100n); // true
 * Uint128.isValid(-1); // false
 * ```
 */
export function isValid(value: bigint | number | string): boolean;
//# sourceMappingURL=isValid.d.ts.map