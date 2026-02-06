/**
 * Get blob versioned hashes for EIP-4844 transaction
 * @param this EIP4844 transaction
 * @returns Array of versioned hashes
 */
export function getBlobVersionedHashes() {
    return this.blobVersionedHashes;
}
