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
export function calculateGas(baseLen: bigint, expLen: bigint, modLen: bigint, expHead: bigint): bigint;
//# sourceMappingURL=calculateGas.d.ts.map