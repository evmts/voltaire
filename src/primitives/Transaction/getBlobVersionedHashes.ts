import type { EIP4844, VersionedHash } from "./types.js";

/**
 * Get blob versioned hashes for EIP-4844 transaction
 * @param this EIP4844 transaction
 * @returns Array of versioned hashes
 */
export function getBlobVersionedHashes(
	this: EIP4844,
): readonly VersionedHash[] {
	return this.blobVersionedHashes;
}
