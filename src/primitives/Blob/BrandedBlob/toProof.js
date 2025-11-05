import { SIZE } from "./constants.js";

/**
 * Generate KZG proof for blob
 *
 * @param {import('../BrandedBlob.js').BrandedBlob} blob - Blob data
 * @param {import('../BrandedBlob.js').Commitment} commitment - KZG commitment for the blob
 * @returns {import('../BrandedBlob.js').Proof} 48-byte KZG proof
 *
 * @example
 * ```javascript
 * const commitment = Blob.toCommitment(blob);
 * const proof = Blob.toProof(blob, commitment);
 * ```
 *
 * TODO: Implement using c-kzg-4844 library
 * - Call computeBlobKzgProof(blob, commitment)
 * - Return 48-byte proof
 */
export function toProof(blob, commitment) {
	if (blob.length !== SIZE) {
		throw new Error(`Invalid blob size: ${blob.length}`);
	}
	if (commitment.length !== 48) {
		throw new Error(`Invalid commitment size: ${commitment.length}`);
	}
	// TODO: const proof = computeBlobKzgProof(blob, commitment);
	// TODO: return proof;
	throw new Error("Not implemented: requires c-kzg-4844 library");
}
