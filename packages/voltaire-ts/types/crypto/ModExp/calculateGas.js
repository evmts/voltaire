/**
 * Calculate gas cost for MODEXP operation per EIP-2565
 *
 * Gas formula: max(200, floor(mult_complexity * iteration_count / 3))
 *
 * @see https://eips.ethereum.org/EIPS/eip-2565
 * @since 0.0.0
 * @param {bigint} baseLen - Length of base in bytes
 * @param {bigint} expLen - Length of exponent in bytes
 * @param {bigint} modLen - Length of modulus in bytes
 * @param {bigint} expHead - First 32 bytes of exponent as BigInt (for leading zeros calc)
 * @returns {bigint} Gas cost
 * @example
 * ```javascript
 * import { ModExp } from './crypto/ModExp/index.js';
 *
 * // Calculate gas for 2^3 mod 5
 * const gas = ModExp.calculateGas(1n, 1n, 1n, 3n);
 * console.log(gas); // 200n (minimum)
 * ```
 */
export function calculateGas(baseLen, expLen, modLen, expHead) {
    const maxLen = baseLen > modLen ? baseLen : modLen;
    const multComplexity = calculateMultiplicationComplexity(maxLen);
    const iterationCount = calculateIterationCount(expLen, expHead);
    const gas = (multComplexity * iterationCount) / 3n;
    return gas > 200n ? gas : 200n;
}
/**
 * Calculate multiplication complexity per EIP-2565
 *
 * - x <= 64: x^2
 * - 64 < x <= 1024: x^2/4 + 96*x - 3072
 * - x > 1024: x^2/16 + 480*x - 199680
 *
 * @param {bigint} x - max(baseLen, modLen)
 * @returns {bigint}
 */
function calculateMultiplicationComplexity(x) {
    if (x <= 64n) {
        return x * x;
    }
    if (x <= 1024n) {
        return (x * x) / 4n + 96n * x - 3072n;
    }
    return (x * x) / 16n + 480n * x - 199680n;
}
/**
 * Calculate iteration count based on exponent
 *
 * iteration_count = max(adjusted_exp_length, 1)
 *
 * @param {bigint} expLen - Exponent length in bytes
 * @param {bigint} expHead - First 32 bytes of exponent as BigInt
 * @returns {bigint}
 */
function calculateIterationCount(expLen, expHead) {
    if (expLen <= 32n) {
        // For small exponents, count bit length - 1
        if (expHead === 0n)
            return 1n;
        const bitLen = BigInt(expHead.toString(2).length);
        return bitLen > 1n ? bitLen - 1n : 1n;
    }
    // For large exponents: 8 * (exp_len - 32) + bit_length(exp_head) - 1
    const bitLen = expHead === 0n ? 0n : BigInt(expHead.toString(2).length);
    const adjusted = 8n * (expLen - 32n) + bitLen;
    return adjusted > 1n ? adjusted - 1n : 1n;
}
