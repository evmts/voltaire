import { SIZE } from "./constants.js";

/**
 * Factory: Generate KZG proof for blob
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(blob: Uint8Array, commitment: Uint8Array) => Uint8Array} deps.computeBlobKzgProof - KZG proof function from c-kzg-4844
 * @returns {(blob: import('../BrandedBlob.js').BrandedBlob, commitment: import('../BrandedBlob.js').Commitment) => import('../BrandedBlob.js').Proof} Function that generates KZG proof
 *
 * @see https://voltaire.tevm.sh/primitives/blob for Blob documentation
 * @since 0.0.0
 * @throws {Error} If blob size, commitment size is invalid or c-kzg-4844 library not available
 * @example
 * ```javascript
 * import { ToProof } from './primitives/Blob/BrandedBlob/index.js';
 * import { computeBlobKzgProof } from 'c-kzg';
 *
 * const toProof = ToProof({ computeBlobKzgProof });
 * const proof = toProof(blob, commitment);
 * ```
 *
 * TODO: Implement using c-kzg-4844 library
 * - Call computeBlobKzgProof(blob, commitment)
 * - Return 48-byte proof
 */
export function ToProof({ computeBlobKzgProof }) {
	return function toProof(blob, commitment) {
		if (blob.length !== SIZE) {
			throw new Error(`Invalid blob size: ${blob.length}`);
		}
		if (commitment.length !== 48) {
			throw new Error(`Invalid commitment size: ${commitment.length}`);
		}
		// TODO: const proof = computeBlobKzgProof(blob, commitment);
		// TODO: return proof;
		throw new Error("Not implemented: requires c-kzg-4844 library");
	};
}
