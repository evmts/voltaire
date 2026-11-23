// @ts-nocheck
/**
 * BLS12-381 Random Private Key Generation
 *
 * Generate cryptographically secure random private keys for BLS signatures.
 *
 * @see https://voltaire.tevm.sh/crypto/bls12-381 for BLS12-381 documentation
 * @since 0.0.0
 */

import { bls12_381 } from "@noble/curves/bls12-381.js";
import { numberToBytesBE } from "@noble/curves/utils.js";
import { constantTimeIsValidScalar } from "../ConstantTime/constantTimeIsValidScalar.js";
import { FR_MOD } from "./constants.js";

const ORDER_BYTES = numberToBytesBE(FR_MOD, 32);

/**
 * Generate a random BLS12-381 private key
 *
 * Uses cryptographically secure random number generation.
 * The key is guaranteed to be valid (non-zero and less than curve order).
 *
 * @returns {Uint8Array} 32-byte private key
 * @example
 * ```javascript
 * import { Bls12381 } from './crypto/Bls12381/index.js';
 *
 * const privateKey = Bls12381.randomPrivateKey();
 * const publicKey = Bls12381.derivePublicKey(privateKey);
 * ```
 */
export function randomPrivateKey() {
	// Use noble's random key generation which handles rejection sampling
	return bls12_381.utils.randomSecretKey();
}

/**
 * Check if a private key is valid
 *
 * A valid private key must be:
 * - 32 bytes
 * - Non-zero
 * - Less than the curve order (Fr modulus)
 *
 * @param {Uint8Array} privateKey - Private key to validate
 * @returns {boolean} True if valid
 * @example
 * ```javascript
 * import { Bls12381 } from './crypto/Bls12381/index.js';
 *
 * const pk = Bls12381.randomPrivateKey();
 * console.log(Bls12381.isValidPrivateKey(pk)); // true
 *
 * const invalid = new Uint8Array(32); // all zeros
 * console.log(Bls12381.isValidPrivateKey(invalid)); // false
 * ```
 */
export function isValidPrivateKey(privateKey) {
	if (!(privateKey instanceof Uint8Array)) {
		return false;
	}
	if (privateKey.length !== 32) {
		return false;
	}

	return constantTimeIsValidScalar(privateKey, ORDER_BYTES);
}
