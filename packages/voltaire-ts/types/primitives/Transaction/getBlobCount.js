/**
 * Get blob count for EIP-4844 transaction
 * @param this EIP4844 transaction
 * @returns Number of blobs
 */
export function getBlobCount() {
    return this.blobVersionedHashes.length;
}
