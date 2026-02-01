/**
 * Modular exponentiation with byte array inputs/outputs
 *
 * Computes base^exp mod modulus where inputs are big-endian byte arrays.
 * Output is padded to modulus length per EIP-198 spec.
 *
 * @see https://eips.ethereum.org/EIPS/eip-198
 * @since 0.0.0
 * @param {Uint8Array} baseBytes - Base as big-endian bytes
 * @param {Uint8Array} expBytes - Exponent as big-endian bytes
 * @param {Uint8Array} modBytes - Modulus as big-endian bytes
 * @returns {Uint8Array} Result as big-endian bytes, padded to modulus length
 * @throws {Error} If modulus is zero
 * @example
 * ```javascript
 * import { ModExp } from './crypto/ModExp/index.js';
 *
 * const base = new Uint8Array([0x02]); // 2
 * const exp = new Uint8Array([0x03]);  // 3
 * const mod = new Uint8Array([0x05]);  // 5
 *
 * const result = ModExp.modexpBytes(base, exp, mod);
 * console.log(result); // Uint8Array([0x03]) = 3
 * ```
 */
export function modexpBytes(baseBytes: Uint8Array, expBytes: Uint8Array, modBytes: Uint8Array): Uint8Array;
//# sourceMappingURL=modexpBytes.d.ts.map