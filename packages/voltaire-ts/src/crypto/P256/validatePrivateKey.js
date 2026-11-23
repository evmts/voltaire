import { numberToBytesBE } from "@noble/curves/utils.js";
import { constantTimeIsValidScalar } from "../ConstantTime/constantTimeIsValidScalar.js";
import { CURVE_ORDER, PRIVATE_KEY_SIZE } from "./constants.js";

const ORDER_BYTES = numberToBytesBE(CURVE_ORDER, PRIVATE_KEY_SIZE);

/**
 * Validate a private key
 *
 * Checks in constant time if the private key is in the valid range [1, n-1]
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./P256PrivateKeyType.js').P256PrivateKeyType} privateKey - Private key to validate
 * @returns {boolean} True if valid, false otherwise
 * @throws {never}
 * @example
 * ```javascript
 * import * as P256 from './crypto/P256/index.js';
 * const privateKey = new Uint8Array(32);
 * const isValid = P256.validatePrivateKey(privateKey);
 * ```
 */
export function validatePrivateKey(privateKey) {
	if (!(privateKey instanceof Uint8Array)) {
		return false;
	}
	if (privateKey.length !== PRIVATE_KEY_SIZE) {
		return false;
	}

	return constantTimeIsValidScalar(privateKey, ORDER_BYTES);
}
