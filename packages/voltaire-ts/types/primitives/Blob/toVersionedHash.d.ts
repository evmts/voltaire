/**
 * Factory: Create versioned hash from commitment
 * Formula: BLOB_COMMITMENT_VERSION_KZG || sha256(commitment)[1:]
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.sha256 - SHA256 hash function
 * @returns {(commitment: import('./BlobType.js').Commitment) => import('./BlobType.js').VersionedHash} Function that creates versioned hash
 *
 * @see https://voltaire.tevm.sh/primitives/blob for Blob documentation
 * @since 0.0.0
 * @throws {InvalidCommitmentSizeError} If commitment size is not 48 bytes
 * @example
 * ```javascript
 * import { ToVersionedHash } from './primitives/Blob/index.js';
 * import { hash as sha256 } from './crypto/SHA256/hash.js';
 *
 * const toVersionedHash = ToVersionedHash({ sha256 });
 * const hash = toVersionedHash(commitment);
 * ```
 */
export function ToVersionedHash({ sha256 }: {
    sha256: (data: Uint8Array) => Uint8Array;
}): (commitment: import("./BlobType.js").Commitment) => import("./BlobType.js").VersionedHash;
//# sourceMappingURL=toVersionedHash.d.ts.map