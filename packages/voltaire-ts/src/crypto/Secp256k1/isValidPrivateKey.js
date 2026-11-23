import { numberToBytesBE } from "@noble/curves/utils.js";
import { constantTimeIsValidScalar } from "../ConstantTime/constantTimeIsValidScalar.js";
import { CURVE_ORDER, PRIVATE_KEY_SIZE } from "./constants.js";

const ORDER_BYTES = numberToBytesBE(CURVE_ORDER, PRIVATE_KEY_SIZE);

/**
 * Validate private key
 *
 * Checks in constant time that the private key is within valid range [1, n-1]
 * where n is the curve order.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Uint8Array} privateKey - 32-byte private key
 * @returns {boolean} true if private key is valid, false otherwise
 * @throws {never}
 * @example
 * ```javascript
 * import * as Secp256k1 from './crypto/Secp256k1/index.js';
 * const privateKey = new Uint8Array(32);
 * const valid = Secp256k1.isValidPrivateKey(privateKey);
 * ```
 */
export function isValidPrivateKey(privateKey) {
	if (!(privateKey instanceof Uint8Array)) return false;
	if (privateKey.length !== PRIVATE_KEY_SIZE) return false;

	return constantTimeIsValidScalar(privateKey, ORDER_BYTES);
}
