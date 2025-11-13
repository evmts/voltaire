import { SIZE } from "./constants.js";

/**
 * Factory: Verify KZG proof
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(blob: Uint8Array, commitment: Uint8Array, proof: Uint8Array) => boolean} deps.verifyBlobKzgProof - KZG verification function from c-kzg-4844
 * @returns {(blob: import('../BrandedBlob.js').BrandedBlob, commitment: import('../BrandedBlob.js').Commitment, proof: import('../BrandedBlob.js').Proof) => boolean} Function that verifies KZG proof
 *
 * @see https://voltaire.tevm.sh/primitives/blob for Blob documentation
 * @since 0.0.0
 * @throws {Error} If blob, commitment, or proof size is invalid or c-kzg-4844 library not available
 * @example
 * ```javascript
 * import { Verify } from './primitives/Blob/BrandedBlob/index.js';
 * import { verifyBlobKzgProof } from 'c-kzg';
 *
 * const verify = Verify({ verifyBlobKzgProof });
 * const isValid = verify(blob, commitment, proof);
 * ```
 *
 * TODO: Implement using c-kzg-4844 library
 * - Call verifyBlobKzgProof(blob, commitment, proof)
 * - Return boolean result
 */
export function Verify({ verifyBlobKzgProof }) {
	return function verify(blob, commitment, proof) {
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
	};
}
