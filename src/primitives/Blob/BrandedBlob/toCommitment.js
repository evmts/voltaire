import { SIZE } from "./constants.js";

/**
 * Compute KZG commitment for blob
 *
 * @see https://voltaire.tevm.sh/primitives/blob for Blob documentation
 * @since 0.0.0
 * @param {import('../BrandedBlob.js').BrandedBlob} blob - Blob data
 * @returns {import('../BrandedBlob.js').Commitment} 48-byte KZG commitment
 * @throws {Error} If blob size is invalid or c-kzg-4844 library not available
 * @example
 * ```javascript
 * import * as Blob from './primitives/Blob/index.js';
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
