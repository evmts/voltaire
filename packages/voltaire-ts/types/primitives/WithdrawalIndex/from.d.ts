/**
 * Create WithdrawalIndex from number, bigint, or string
 *
 * @see https://voltaire.tevm.sh/primitives/withdrawal-index for WithdrawalIndex documentation
 * @see https://eips.ethereum.org/EIPS/eip-4895 for EIP-4895 specification
 * @since 0.0.0
 * @param {number | bigint | string} value - Withdrawal index (number, bigint, or decimal/hex string)
 * @returns {import('./WithdrawalIndexType.js').WithdrawalIndexType} WithdrawalIndex value
 * @throws {Error} If value is negative, exceeds uint64 max, or invalid
 * @example
 * ```javascript
 * import * as WithdrawalIndex from './primitives/WithdrawalIndex/index.js';
 * const idx1 = WithdrawalIndex.from(1000000n);
 * const idx2 = WithdrawalIndex.from(1000000);
 * const idx3 = WithdrawalIndex.from("0xf4240");
 * ```
 */
export function from(value: number | bigint | string): import("./WithdrawalIndexType.js").WithdrawalIndexType;
/**
 * Maximum value for uint64 (2^64 - 1)
 * Per EIP-4895, withdrawal index is a uint64
 */
export const UINT64_MAX: 18446744073709551615n;
//# sourceMappingURL=from.d.ts.map