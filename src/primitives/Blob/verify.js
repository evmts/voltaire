import { SIZE } from "./constants.js";

/**
 * Factory: Verify KZG proof
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(blob: Uint8Array, commitment: Uint8Array, proof: Uint8Array) => boolean} deps.verifyBlobKzgProof - KZG verification function from c-kzg-4844
 * @returns {(blob: import('./BlobType.js').BrandedBlob, commitment: import('./BlobType.js').Commitment, proof: import('./BlobType.js').Proof) => boolean} Function that verifies KZG proof
 *
 * @see https://voltaire.tevm.sh/primitives/blob for Blob documentation
 * @since 0.0.0
 * @throws {Error} If blob, commitment, or proof size is invalid or c-kzg-4844 library not available
 * @example
 * ```javascript
 * import { Verify } from './primitives/Blob/index.js';
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
import { InvalidLengthError, PrimitiveError } from "../errors/index.js";

export function Verify({ verifyBlobKzgProof }) {
	return function verify(blob, commitment, proof) {
		if (blob.length !== SIZE) {
			throw new InvalidLengthError(`Invalid blob size: ${blob.length}`, {
				value: blob.length,
				expected: `${SIZE} bytes`,
				code: "BLOB_INVALID_SIZE",
				docsPath: "/primitives/blob/verify#error-handling",
			});
		}
		if (commitment.length !== 48) {
			throw new InvalidLengthError(
				`Invalid commitment size: ${commitment.length}`,
				{
					value: commitment.length,
					expected: "48 bytes",
					code: "BLOB_INVALID_COMMITMENT_SIZE",
					docsPath: "/primitives/blob/verify#error-handling",
				},
			);
		}
		if (proof.length !== 48) {
			throw new InvalidLengthError(`Invalid proof size: ${proof.length}`, {
				value: proof.length,
				expected: "48 bytes",
				code: "BLOB_INVALID_PROOF_SIZE",
				docsPath: "/primitives/blob/verify#error-handling",
			});
		}
		try {
			return verifyBlobKzgProof(blob, commitment, proof);
		} catch (error) {
			throw new PrimitiveError(
				`Failed to verify KZG proof: ${error instanceof Error ? error.message : String(error)}`,
				{
					code: "BLOB_KZG_VERIFICATION_FAILED",
					docsPath: "/primitives/blob/verify#error-handling",
					cause: error instanceof Error ? error : undefined,
				},
			);
		}
	};
}
