import { derivePublicKey } from "../crypto/Secp256k1/derivePublicKey.js";
import { randomPrivateKey } from "../crypto/Secp256k1/randomPrivateKey.js";
import { Address } from "../primitives/Address/index.js";

/**
 * Generate a cryptographically secure random Ethereum address
 * Uses secp256k1 to generate random private key, derives public key,
 * and returns the address (last 20 bytes of keccak256(pubkey))
 *
 * Key generation rejection-samples a uniform key in [1, n-1] and derives the
 * public key with the constant-time `@noble/curves` base-point multiply.
 *
 * @returns {import('../primitives/Address/AddressType.js').AddressType} Randomly generated address
 *
 * @example
 * ```typescript
 * import { wallet } from '@tevm/voltaire/native';
 * const address = wallet.randomAddress();
 *
 * const randomAddr = randomAddress();
 * console.log(Address.toHex(randomAddr));
 * ```
 */
export function randomAddress() {
	const privateKey =
		/** @type {import('../primitives/PrivateKey/PrivateKeyType.js').PrivateKeyType} */ (
			randomPrivateKey()
		);
	try {
		return Address.fromPublicKey(derivePublicKey(privateKey));
	} finally {
		privateKey.fill(0);
	}
}
