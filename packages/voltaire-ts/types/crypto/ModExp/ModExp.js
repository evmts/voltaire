// @ts-nocheck
import { calculateGas } from "./calculateGas.js";
import { modexp } from "./compute.js";
import { modexpBytes } from "./modexpBytes.js";
// Export individual functions
export { modexp, modexpBytes, calculateGas };
/**
 * ModExp - Modular Exponentiation
 *
 * Computes base^exp mod modulus for arbitrary-precision integers.
 * Used by MODEXP precompile (0x05) per EIP-198/EIP-2565.
 *
 * @see https://eips.ethereum.org/EIPS/eip-198 - ModExp precompile
 * @see https://eips.ethereum.org/EIPS/eip-2565 - Gas cost repricing
 * @since 0.0.0
 * @example
 * ```javascript
 * import { ModExp } from './crypto/ModExp/index.js';
 *
 * // Using BigInt directly
 * const result = ModExp.modexp(2n, 10n, 1000n); // 24n
 *
 * // Using byte arrays (EIP-198 format)
 * const base = new Uint8Array([0x02]);
 * const exp = new Uint8Array([0x0a]);
 * const mod = new Uint8Array([0x03, 0xe8]);
 * const resultBytes = ModExp.modexpBytes(base, exp, mod);
 *
 * // Calculate gas cost
 * const gas = ModExp.calculateGas(1n, 1n, 2n, 10n);
 * ```
 */
export const ModExp = Object.assign(modexp, {
    // Primary API
    modexp,
    modexpBytes,
    calculateGas,
});
