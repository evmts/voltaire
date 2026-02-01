/**
 * Maximum value for uint64 (2^64 - 1)
 * Per EIP-4895, withdrawal index is a uint64
 */
export const UINT64_MAX = 18446744073709551615n;
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
export function from(value) {
    let bigintValue;
    if (typeof value === "string") {
        bigintValue = BigInt(value);
    }
    else if (typeof value === "number") {
        if (!Number.isSafeInteger(value)) {
            throw new Error(`WithdrawalIndex value must be a safe integer: ${value}`);
        }
        if (value < 0) {
            throw new Error(`WithdrawalIndex value cannot be negative: ${value}`);
        }
        bigintValue = BigInt(value);
    }
    else {
        bigintValue = value;
    }
    if (bigintValue < 0n) {
        throw new Error(`WithdrawalIndex value cannot be negative: ${bigintValue}`);
    }
    if (bigintValue > UINT64_MAX) {
        throw new Error(`WithdrawalIndex value exceeds uint64 max (${UINT64_MAX}): ${bigintValue}`);
    }
    return /** @type {import('./WithdrawalIndexType.js').WithdrawalIndexType} */ (bigintValue);
}
