/**
 * Modular exponentiation: base^exp mod modulus
 *
 * Computes arbitrary-precision modular exponentiation using native BigInt.
 * Used by MODEXP precompile (0x05) per EIP-198.
 *
 * WARNING: This implementation is for general use. For cryptographic
 * applications, consider timing attack resistance.
 *
 * @see https://eips.ethereum.org/EIPS/eip-198
 * @since 0.0.0
 * @param {bigint} base - Base value
 * @param {bigint} exp - Exponent value
 * @param {bigint} modulus - Modulus value (must be > 0)
 * @returns {bigint} Result of base^exp mod modulus
 * @throws {Error} If modulus is zero
 * @example
 * ```javascript
 * import { ModExp } from './crypto/ModExp/index.js';
 *
 * // Compute 2^10 mod 1000 = 24
 * const result = ModExp.modexp(2n, 10n, 1000n);
 * console.log(result); // 24n
 *
 * // RSA verification: signature^e mod n
 * const verified = ModExp.modexp(signature, e, n);
 * ```
 */
export function modexp(base: bigint, exp: bigint, modulus: bigint): bigint;
//# sourceMappingURL=compute.d.ts.map