import { MAX_PER_TRANSACTION } from "./constants.js";

/**
 * Verify multiple blob proofs in batch
 *
 * @see https://voltaire.tevm.sh/primitives/blob for Blob documentation
 * @since 0.0.0
 * @param {readonly import('../BrandedBlob.js').BrandedBlob[]} blobs - Array of blobs
 * @param {readonly import('../BrandedBlob.js').Commitment[]} commitments - Array of commitments
 * @param {readonly import('../BrandedBlob.js').Proof[]} proofs - Array of proofs
 * @returns {boolean} true if all proofs are valid
 * @throws {Error} If arrays have different lengths, too many blobs, or c-kzg-4844 library not available
 * @example
 * ```javascript
 * import * as Blob from './primitives/Blob/index.js';
 * const isValid = Blob.verifyBatch(blobs, commitments, proofs);
 * ```
 *
 * TODO: Implement using c-kzg-4844 library
 * - Validate arrays have same length
 * - Call verifyBlobKzgProofBatch(blobs, commitments, proofs)
 * - Return boolean result
 */
export function verifyBatch(blobs, commitments, proofs) {
	if (blobs.length !== commitments.length || blobs.length !== proofs.length) {
		throw new Error("Arrays must have same length");
	}
	if (blobs.length > MAX_PER_TRANSACTION) {
		throw new Error(
			`Too many blobs: ${blobs.length} (max ${MAX_PER_TRANSACTION})`,
		);
	}
	// TODO: return verifyBlobKzgProofBatch(blobs, commitments, proofs);
	throw new Error("Not implemented: requires c-kzg-4844 library");
}
