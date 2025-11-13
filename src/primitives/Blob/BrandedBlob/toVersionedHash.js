import { COMMITMENT_VERSION_KZG } from "./constants.js";

/**
 * Factory: Create versioned hash from commitment
 * Formula: BLOB_COMMITMENT_VERSION_KZG || sha256(commitment)[1:]
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.sha256 - SHA256 hash function
 * @returns {(commitment: import('../BrandedBlob.js').Commitment) => import('../BrandedBlob.js').VersionedHash} Function that creates versioned hash
 *
 * @see https://voltaire.tevm.sh/primitives/blob for Blob documentation
 * @since 0.0.0
 * @throws {Error} If commitment size is invalid
 * @example
 * ```javascript
 * import { ToVersionedHash } from './primitives/Blob/BrandedBlob/index.js';
 * import { hash as sha256 } from './crypto/SHA256/hash.js';
 *
 * const toVersionedHash = ToVersionedHash({ sha256 });
 * const hash = toVersionedHash(commitment);
 * ```
 */
export function ToVersionedHash({ sha256 }) {
	return function toVersionedHash(commitment) {
		if (commitment.length !== 48) {
			throw new Error(`Invalid commitment size: ${commitment.length}`);
		}

		// Hash the commitment with SHA-256
		const hash = sha256(commitment);

		// Create versioned hash: version byte + hash[1:32]
		const versionedHash = new Uint8Array(32);
		versionedHash[0] = COMMITMENT_VERSION_KZG;
		versionedHash.set(hash.slice(1), 1);

		return /** @type {import('../BrandedBlob.js').VersionedHash} */ (
			versionedHash
		);
	};
}
