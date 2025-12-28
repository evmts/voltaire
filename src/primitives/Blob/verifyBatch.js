import { InvalidLengthError, PrimitiveError } from "../errors/index.js";
import { MAX_PER_TRANSACTION, SIZE } from "./constants.js";

/**
 * Factory: Verify multiple blob KZG proofs in batch
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(blobs: Uint8Array[], commitments: Uint8Array[], proofs: Uint8Array[]) => boolean} deps.verifyBlobKzgProofBatch - KZG batch verification function from c-kzg-4844
 * @returns {(blobs: readonly import('./BlobType.js').BrandedBlob[], commitments: readonly import('./BlobType.js').Commitment[], proofs: readonly import('./BlobType.js').Proof[]) => boolean} Function that verifies batch of blob KZG proofs
 *
 * @see https://voltaire.tevm.sh/primitives/blob for Blob documentation
 * @since 0.0.0
 * @throws {InvalidLengthError} If arrays have different lengths or too many blobs
 * @throws {PrimitiveError} If batch verification fails
 * @example
 * ```javascript
 * import { VerifyBatch } from './primitives/Blob/index.js';
 * import { verifyBlobKzgProofBatch } from 'c-kzg';
 *
 * const verifyBatch = VerifyBatch({ verifyBlobKzgProofBatch });
 * const isValid = verifyBatch(blobs, commitments, proofs);
 * ```
 */
export function VerifyBatch({ verifyBlobKzgProofBatch }) {
	return function verifyBatch(blobs, commitments, proofs) {
		if (blobs.length !== commitments.length || blobs.length !== proofs.length) {
			throw new InvalidLengthError("Arrays must have same length", {
				value: `blobs: ${blobs.length}, commitments: ${commitments.length}, proofs: ${proofs.length}`,
				expected: "same length",
				code: "BLOB_BATCH_LENGTH_MISMATCH",
				docsPath: "/primitives/blob/verify-batch#error-handling",
			});
		}
		if (blobs.length > MAX_PER_TRANSACTION) {
			throw new InvalidLengthError(
				`Too many blobs: ${blobs.length} (max ${MAX_PER_TRANSACTION})`,
				{
					value: blobs.length,
					expected: `<= ${MAX_PER_TRANSACTION}`,
					code: "BLOB_BATCH_TOO_MANY",
					docsPath: "/primitives/blob/verify-batch#error-handling",
				},
			);
		}
		// Validate blob sizes
		for (let i = 0; i < blobs.length; i++) {
			const blob = /** @type {Uint8Array} */ (blobs[i]);
			if (blob.length !== SIZE) {
				throw new InvalidLengthError(
					`Invalid blob size at index ${i}: ${blob.length}`,
					{
						value: blob.length,
						expected: `${SIZE} bytes`,
						code: "BLOB_INVALID_SIZE",
						docsPath: "/primitives/blob/verify-batch#error-handling",
					},
				);
			}
		}
		// Validate commitment sizes
		for (let i = 0; i < commitments.length; i++) {
			const commitment = /** @type {Uint8Array} */ (commitments[i]);
			if (commitment.length !== 48) {
				throw new InvalidLengthError(
					`Invalid commitment size at index ${i}: ${commitment.length}`,
					{
						value: commitment.length,
						expected: "48 bytes",
						code: "BLOB_INVALID_COMMITMENT_SIZE",
						docsPath: "/primitives/blob/verify-batch#error-handling",
					},
				);
			}
		}
		// Validate proof sizes
		for (let i = 0; i < proofs.length; i++) {
			const proof = /** @type {Uint8Array} */ (proofs[i]);
			if (proof.length !== 48) {
				throw new InvalidLengthError(
					`Invalid proof size at index ${i}: ${proof.length}`,
					{
						value: proof.length,
						expected: "48 bytes",
						code: "BLOB_INVALID_PROOF_SIZE",
						docsPath: "/primitives/blob/verify-batch#error-handling",
					},
				);
			}
		}
		try {
			return verifyBlobKzgProofBatch(
				/** @type {Uint8Array[]} */ ([...blobs]),
				/** @type {Uint8Array[]} */ ([...commitments]),
				/** @type {Uint8Array[]} */ ([...proofs]),
			);
		} catch (error) {
			throw new PrimitiveError(
				`Failed to verify KZG proofs batch: ${error instanceof Error ? error.message : String(error)}`,
				{
					code: "BLOB_KZG_BATCH_VERIFICATION_FAILED",
					docsPath: "/primitives/blob/verify-batch#error-handling",
					cause: error instanceof Error ? error : undefined,
				},
			);
		}
	};
}
