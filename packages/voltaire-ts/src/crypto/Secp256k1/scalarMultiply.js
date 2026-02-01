// @ts-nocheck
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { Secp256k1Error } from "./errors.js";

/**
 * Multiply generator point by scalar
 *
 * Performs scalar multiplication: scalar * G (generator point).
 * Used in ERC-5564 stealth address generation.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @see https://eips.ethereum.org/EIPS/eip-5564 for ERC-5564 stealth addresses
 * @since 0.0.0
 * @param {Uint8Array} scalar - 32-byte scalar value
 * @returns {import('./Secp256k1PublicKeyType.js').Secp256k1PublicKeyType} Result 64-byte uncompressed public key
 * @throws {Secp256k1Error} If scalar multiplication fails
 * @example
 * ```javascript
 * import * as Secp256k1 from './crypto/Secp256k1/index.js';
 * const scalar = new Uint8Array(32);
 * scalar[31] = 5; // scalar = 5
 * const result = Secp256k1.scalarMultiply(scalar);
 * console.log(result.length); // 64
 * ```
 */
export function scalarMultiply(scalar) {
	if (scalar.length !== 32) {
		throw new Secp256k1Error(`Scalar must be 32 bytes, got ${scalar.length}`, {
			code: "INVALID_SCALAR_LENGTH",
			context: { actualLength: scalar.length },
			docsPath: "/crypto/secp256k1/scalar-multiply#error-handling",
		});
	}

	try {
		// Get public key from private key (which is scalar * G)
		const result = secp256k1.getPublicKey(scalar, false);

		if (result[0] !== 0x04) {
			throw new Secp256k1Error(
				"Invalid point format after scalar multiplication",
				{
					code: "INVALID_POINT_FORMAT",
					context: { prefix: result[0] },
					docsPath: "/crypto/secp256k1/scalar-multiply#error-handling",
				},
			);
		}

		// Return 64 bytes without 0x04 prefix
		return /** @type {import('./Secp256k1PublicKeyType.js').Secp256k1PublicKeyType} */ (
			result.slice(1)
		);
	} catch (error) {
		throw new Secp256k1Error(`Scalar multiplication failed: ${error}`, {
			code: "SCALAR_MULTIPLY_FAILED",
			context: { scalarLength: scalar.length },
			docsPath: "/crypto/secp256k1/scalar-multiply#error-handling",
			cause: error,
		});
	}
}
