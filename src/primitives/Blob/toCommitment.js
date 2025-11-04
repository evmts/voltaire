import { SIZE } from "./constants.js";

/**
 * Compute KZG commitment for blob
 *
 * @param {import('./BrandedBlob.js').BrandedBlob} blob - Blob data
 * @returns {import('./BrandedBlob.js').Commitment} 48-byte KZG commitment
 *
 * @example
 * ```javascript
 * const commitment = Blob.toCommitment(blob);
 * ```
 *
 * TODO: Implement using c-kzg-4844 library
 * - Load KZG trusted setup
 * - Call blobToKzgCommitment(blob)
 * - Return 48-byte commitment
 */
export function toCommitment(blob) {
	if (blob.length !== SIZE) {
		throw new Error(`Invalid blob size: ${blob.length}`);
	}
	// TODO: const commitment = blobToKzgCommitment(blob);
	// TODO: return commitment;
	throw new Error("Not implemented: requires c-kzg-4844 library");
}
