import { InvalidValueError } from "./errors.js";
import { FromPublicKey } from "./fromPublicKey.js";

/**
 * Factory: Create Address from secp256k1 private key
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @param {(privateKey: Uint8Array) => Uint8Array} deps.derivePublicKey - Secp256k1 public key derivation function
 * @returns {(privateKey: Uint8Array | import('../PrivateKey/PrivateKeyType.js').PrivateKeyType) => import('./AddressType.js').AddressType} Function that creates Address from private key
 *
 * @example
 * ```typescript
 * import { FromPrivateKey } from '@tevm/voltaire/Address/BrandedAddress'
 * import { hash as keccak256 } from '@tevm/voltaire/crypto/Keccak256'
 * import { derivePublicKey } from '@tevm/voltaire/crypto/Secp256k1'
 *
 * const fromPrivateKey = FromPrivateKey({ keccak256, derivePublicKey })
 * const addr = fromPrivateKey(privateKey)
 * ```
 */
export function FromPrivateKey({ keccak256, derivePublicKey }) {
	const fromPublicKey = FromPublicKey({ keccak256 });

	return function fromPrivateKey(privateKey) {
		// Derive 64-byte uncompressed public key
		let pubkey;
		try {
			pubkey = derivePublicKey(privateKey);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			throw new InvalidValueError(`Invalid private key: ${message}`, {
				value: privateKey,
				cause: error instanceof Error ? error : undefined,
			});
		}

		// Pass 64-byte uncompressed public key directly without BigInt round-trip
		return fromPublicKey(pubkey);
	};
}
