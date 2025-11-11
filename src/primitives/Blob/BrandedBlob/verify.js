import { SIZE } from "./constants.js";

/**
 * Verify KZG proof
 *
 * @see https://voltaire.tevm.sh/primitives/blob for Blob documentation
 * @since 0.0.0
 * @param {import('../BrandedBlob.js').BrandedBlob} blob - Blob data
 * @param {import('../BrandedBlob.js').Commitment} commitment - KZG commitment
 * @param {import('../BrandedBlob.js').Proof} proof - KZG proof
 * @returns {boolean} true if proof is valid
 * @throws {Error} If blob, commitment, or proof size is invalid or c-kzg-4844 library not available
 * @example
 * ```javascript
 * import * as Blob from './primitives/Blob/index.js';
 * const isValid = Blob.verify(blob, commitment, proof);
 * ```
 *
 * TODO: Implement using c-kzg-4844 library
 * - Call verifyBlobKzgProof(blob, commitment, proof)
 * - Return boolean result
 */
export function verify(blob, commitment, proof) {
	if (blob.length !== SIZE) {
		throw new Error(`Invalid blob size: ${blob.length}`);
	}
	if (commitment.length !== 48) {
		throw new Error(`Invalid commitment size: ${commitment.length}`);
	}
	if (proof.length !== 48) {
		throw new Error(`Invalid proof size: ${proof.length}`);
	}
	// TODO: return verifyBlobKzgProof(blob, commitment, proof);
	throw new Error("Not implemented: requires c-kzg-4844 library");
}
