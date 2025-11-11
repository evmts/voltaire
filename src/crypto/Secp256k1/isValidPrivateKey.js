// @ts-nocheck
import { CURVE_ORDER, PRIVATE_KEY_SIZE } from "./constants.js";

/**
 * Convert 32-byte big-endian array to bigint
 * @param {Uint8Array} bytes
 * @returns {bigint}
 */
function bytes32ToBigInt(bytes) {
	if (bytes.length !== 32) {
		throw new Error(`Expected 32 bytes, got ${bytes.length}`);
	}
	let result = 0n;
	for (let i = 0; i < 32; i++) {
		result = (result << 8n) | BigInt(bytes[i] ?? 0);
	}
	return result;
}

/**
 * Validate private key
 *
 * Checks that the private key is within valid range [1, n-1] where n
 * is the curve order.
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
	if (privateKey.length !== PRIVATE_KEY_SIZE) return false;

	try {
		const value = bytes32ToBigInt(privateKey);

		// Private key must be in [1, n-1]
		if (value === 0n || value >= CURVE_ORDER) return false;

		return true;
	} catch {
		return false;
	}
}
