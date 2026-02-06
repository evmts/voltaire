/**
 * Convert WithdrawalIndex to bigint
 *
 * @see https://voltaire.tevm.sh/primitives/withdrawal-index for WithdrawalIndex documentation
 * @since 0.0.0
 * @param {import('./WithdrawalIndexType.js').WithdrawalIndexType} index - WithdrawalIndex value
 * @returns {bigint} BigInt representation
 * @throws {never}
 * @example
 * ```javascript
 * import * as WithdrawalIndex from './primitives/WithdrawalIndex/index.js';
 * const idx = WithdrawalIndex.from(1000000);
 * const big = WithdrawalIndex.toBigInt(idx); // 1000000n
 * ```
 */
export function toBigInt(index: import("./WithdrawalIndexType.js").WithdrawalIndexType): bigint;
//# sourceMappingURL=toBigInt.d.ts.map