import type { BrandedBlob, Commitment, Proof } from "./BrandedBlob.js";
import { SIZE } from "./constants.js";

/**
 * Verify KZG proof
 *
 * @param blob - Blob data
 * @param commitment - KZG commitment
 * @param proof - KZG proof
 * @returns true if proof is valid
 *
 * @example
 * ```typescript
 * const isValid = Blob.verify(blob, commitment, proof);
 * ```
 *
 * TODO: Implement using c-kzg-4844 library
 * - Call verifyBlobKzgProof(blob, commitment, proof)
 * - Return boolean result
 */
export function verify(
	blob: BrandedBlob,
	commitment: Commitment,
	proof: Proof,
): boolean {
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
