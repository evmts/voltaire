/**
 * Convert WithdrawalIndex to number
 *
 * @see https://voltaire.tevm.sh/primitives/withdrawal-index for WithdrawalIndex documentation
 * @since 0.0.0
 * @param {import('./WithdrawalIndexType.js').WithdrawalIndexType} index - WithdrawalIndex value
 * @returns {number} Number representation
 * @throws {Error} If index exceeds safe integer range
 * @example
 * ```javascript
 * import * as WithdrawalIndex from './primitives/WithdrawalIndex/index.js';
 * const idx = WithdrawalIndex.from(1000000n);
 * const num = WithdrawalIndex.toNumber(idx); // 1000000
 * ```
 */
export function toNumber(index: import("./WithdrawalIndexType.js").WithdrawalIndexType): number;
//# sourceMappingURL=toNumber.d.ts.map