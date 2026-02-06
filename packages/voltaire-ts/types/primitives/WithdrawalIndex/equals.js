/**
 * Check if WithdrawalIndex values are equal
 *
 * @see https://voltaire.tevm.sh/primitives/withdrawal-index for WithdrawalIndex documentation
 * @since 0.0.0
 * @param {import('./WithdrawalIndexType.js').WithdrawalIndexType} a - First withdrawal index
 * @param {import('./WithdrawalIndexType.js').WithdrawalIndexType} b - Second withdrawal index
 * @returns {boolean} true if equal
 * @throws {never}
 * @example
 * ```javascript
 * import * as WithdrawalIndex from './primitives/WithdrawalIndex/index.js';
 * const a = WithdrawalIndex.from(1000000n);
 * const b = WithdrawalIndex.from(1000000n);
 * const result = WithdrawalIndex.equals(a, b); // true
 * ```
 */
export function equals(a, b) {
    return a === b;
}
