import type { EIP4844 } from "./types.js";

/**
 * Get blob count for EIP-4844 transaction
 * @param this EIP4844 transaction
 * @returns Number of blobs
 */
export function getBlobCount(this: EIP4844): number {
	return this.blobVersionedHashes.length;
}
