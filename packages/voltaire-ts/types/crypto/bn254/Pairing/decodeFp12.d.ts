/**
 * Decode the canonical integer produced by `encodeFp12` back to an Fp12
 * element.
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {bigint} value - Canonical integer in `[0, p^12)`
 * @returns {import('@noble/curves/abstract/tower.js').Fp12} Fp12 element
 * @throws {Bn254Error} If the value is outside `[0, p^12)`
 * @example
 * ```javascript
 * import { decodeFp12 } from './crypto/bn254/Pairing/decodeFp12.js';
 * const one = decodeFp12(1n);
 * ```
 */
export function decodeFp12(value: bigint): import("@noble/curves/abstract/tower.js").Fp12;
//# sourceMappingURL=decodeFp12.d.ts.map