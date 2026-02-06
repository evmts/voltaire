/**
 * Pairing result utilities
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 */

/**
 * Check if two pairing results are equal
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {{value: bigint}} a - First result
 * @param {{value: bigint}} b - Second result
 * @returns {boolean} True if equal
 * @throws {never}
 * @example
 * ```javascript
 * import { pairingResultEqual, pairingResultOne } from './crypto/bn254/Pairing/pairingResult.js';
 * const a = pairingResultOne();
 * const b = pairingResultOne();
 * if (pairingResultEqual(a, b)) {
 *   console.log('Results are equal');
 * }
 * ```
 */
export function pairingResultEqual(a, b) {
	return a.value === b.value;
}

/**
 * Get the identity element for pairing results
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @returns {{value: bigint}} Identity element
 * @throws {never}
 * @example
 * ```javascript
 * import { pairingResultOne } from './crypto/bn254/Pairing/pairingResult.js';
 * const one = pairingResultOne();
 * ```
 */
export function pairingResultOne() {
	return { value: 1n };
}
