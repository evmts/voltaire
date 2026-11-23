/**
 * Calculate MODEXP gas for the active hardfork: EIP-198, EIP-2565 or EIP-7883.
 *
 * Defaults to Berlin pricing. Operand-length bounds are enforced by the precompile.
 *
 * @see https://eips.ethereum.org/EIPS/eip-2565
 * @since 0.0.0
 * @param {bigint} baseLen - Length of base in bytes
 * @param {bigint} expLen - Length of exponent in bytes
 * @param {bigint} modLen - Length of modulus in bytes
 * @param {bigint} expHead - First 32 bytes of exponent as BigInt (for leading zeros calc)
 * @param {import('../../primitives/Hardfork/HardforkType.js').HardforkType} [hardfork] - Active fork; defaults to Berlin
 * @returns {bigint} Gas cost
 * @example
 * ```javascript
 * import { ModExp } from '@tevm/voltaire/ModExp';
 *
 * // Calculate gas for 2^3 mod 5
 * const gas = ModExp.calculateGas(1n, 1n, 1n, 3n);
 * console.log(gas); // 200n (minimum)
 * ```
 */
export function calculateGas(baseLen: bigint, expLen: bigint, modLen: bigint, expHead: bigint, hardfork?: import("../../primitives/Hardfork/HardforkType.js").HardforkType): bigint;
//# sourceMappingURL=calculateGas.d.ts.map