// @ts-nocheck
import { PRIVATE_KEY_SIZE } from "./constants.js";
import { StealthAddressError } from "./errors.js";

/**
 * Compute stealth private key from spending private key and shared secret hash
 *
 * Implements ERC-5564 private key derivation:
 * stealthPrivateKey = (spendingPrivateKey + hashedSharedSecret) mod n
 *
 * Where n is the secp256k1 curve order.
 *
 * @see https://eips.ethereum.org/EIPS/eip-5564#stealth-private-key
 * @see https://voltaire.tevm.sh/primitives/stealth-address for StealthAddress documentation
 * @since 0.0.0
 * @param {Uint8Array} spendingPrivateKey - 32-byte spending private key
 * @param {Uint8Array} hashedSharedSecret - 32-byte hashed shared secret
 * @returns {Uint8Array} 32-byte stealth private key
 * @throws {StealthAddressError} If computation fails
 * @example
 * ```javascript
 * import * as StealthAddress from './primitives/StealthAddress/index.js';
 *
 * // After finding matching stealth address
 * const stealthPrivKey = StealthAddress.computeStealthPrivateKey(
 *   spendingPrivateKey,
 *   hashedSharedSecret
 * );
 * // Use stealthPrivKey to spend from stealth address
 * ```
 */
export function computeStealthPrivateKey(
	spendingPrivateKey,
	hashedSharedSecret,
) {
	if (spendingPrivateKey.length !== PRIVATE_KEY_SIZE) {
		throw new StealthAddressError(
			`Spending private key must be ${PRIVATE_KEY_SIZE} bytes, got ${spendingPrivateKey.length}`,
			{
				code: "INVALID_SPENDING_PRIVATE_KEY_LENGTH",
				context: { actualLength: spendingPrivateKey.length },
			},
		);
	}

	if (hashedSharedSecret.length !== PRIVATE_KEY_SIZE) {
		throw new StealthAddressError(
			`Hashed shared secret must be ${PRIVATE_KEY_SIZE} bytes, got ${hashedSharedSecret.length}`,
			{
				code: "INVALID_HASHED_SHARED_SECRET_LENGTH",
				context: { actualLength: hashedSharedSecret.length },
			},
		);
	}

	try {
		// secp256k1 curve order
		const n =
			0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;

		// Convert bytes to bigint
		let spendingKey = 0n;
		for (let i = 0; i < 32; i++) {
			spendingKey = (spendingKey << 8n) | BigInt(spendingPrivateKey[i]);
		}

		let secret = 0n;
		for (let i = 0; i < 32; i++) {
			secret = (secret << 8n) | BigInt(hashedSharedSecret[i]);
		}

		// Compute stealth private key: (spendingKey + secret) mod n
		const stealthKey = (spendingKey + secret) % n;

		// Convert back to bytes
		const result = new Uint8Array(32);
		let temp = stealthKey;
		for (let i = 31; i >= 0; i--) {
			result[i] = Number(temp & 0xffn);
			temp >>= 8n;
		}

		return result;
	} catch (error) {
		throw new StealthAddressError(
			`Stealth private key computation failed: ${error}`,
			{
				code: "COMPUTATION_FAILED",
				cause: error,
			},
		);
	}
}
