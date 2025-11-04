import { COMMITMENT_VERSION_KZG } from "./constants.js";
import { SHA256 } from "../../crypto/SHA256/index.js";

/**
 * Create versioned hash from commitment
 * Formula: BLOB_COMMITMENT_VERSION_KZG || sha256(commitment)[1:]
 *
 * @param {import('./BrandedBlob.js').Commitment} commitment - KZG commitment
 * @returns {import('./BrandedBlob.js').VersionedHash} 32-byte versioned hash
 *
 * @example
 * ```javascript
 * const hash = Blob.toVersionedHash(commitment);
 * ```
 */
export function toVersionedHash(commitment) {
	if (commitment.length !== 48) {
		throw new Error(`Invalid commitment size: ${commitment.length}`);
	}

	// Hash the commitment with SHA-256
	const hash = SHA256.hash(commitment);

	// Create versioned hash: version byte + hash[1:32]
	const versionedHash = new Uint8Array(32);
	versionedHash[0] = COMMITMENT_VERSION_KZG;
	versionedHash.set(hash.slice(1), 1);

	return versionedHash;
}
