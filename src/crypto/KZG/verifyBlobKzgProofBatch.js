import { BYTES_PER_COMMITMENT, BYTES_PER_PROOF } from "./constants.js";
import { KzgError, KzgNotInitializedError } from "./errors.js";
import { getInitialized } from "./loadTrustedSetup.js";
import { validateBlob } from "./validateBlob.js";

/**
 * Factory: Verify multiple blob KZG proofs (batch verification)
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(blobs: Uint8Array[], commitments: Uint8Array[], proofs: Uint8Array[]) => boolean} deps.verifyBlobKzgProofBatch - c-kzg verifyBlobKzgProofBatch function
 * @returns {(blobs: Uint8Array[], commitments: Uint8Array[], proofs: Uint8Array[]) => boolean} Function that verifies batch of blob KZG proofs
 *
 * @example
 * ```typescript
 * import { VerifyBlobKzgProofBatch } from '@tevm/voltaire/crypto/KZG'
 * import * as ckzg from 'c-kzg'
 *
 * const verifyBlobKzgProofBatch = VerifyBlobKzgProofBatch({ verifyBlobKzgProofBatch: ckzg.verifyBlobKzgProofBatch })
 * const valid = verifyBlobKzgProofBatch(blobs, commitments, proofs)
 * ```
 */
export function VerifyBlobKzgProofBatch({
	verifyBlobKzgProofBatch: ckzgVerifyBlobKzgProofBatch,
}) {
	return function verifyBlobKzgProofBatch(blobs, commitments, proofs) {
		if (!getInitialized()) {
			throw new KzgNotInitializedError();
		}
		if (blobs.length !== commitments.length || blobs.length !== proofs.length) {
			throw new KzgError(
				"Blobs, commitments, and proofs arrays must have same length",
				{
					code: "KZG_BATCH_LENGTH_MISMATCH",
					context: {
						blobsLength: blobs.length,
						commitmentsLength: commitments.length,
						proofsLength: proofs.length,
					},
					docsPath: "/crypto/kzg/verify-blob-kzg-proof-batch#error-handling",
				},
			);
		}
		for (const blob of blobs) {
			validateBlob(blob);
		}
		for (let i = 0; i < commitments.length; i++) {
			const commitment = commitments[i];
			if (
				!(commitment instanceof Uint8Array) ||
				commitment.length !== BYTES_PER_COMMITMENT
			) {
				throw new KzgError(
					`Commitment at index ${i} must be ${BYTES_PER_COMMITMENT} bytes, got ${commitment instanceof Uint8Array ? commitment.length : "not Uint8Array"}`,
					{
						code: "KZG_INVALID_COMMITMENT",
						context: {
							index: i,
							commitmentType:
								commitment instanceof Uint8Array
									? "Uint8Array"
									: typeof commitment,
							commitmentLength:
								commitment instanceof Uint8Array ? commitment.length : undefined,
							expected: BYTES_PER_COMMITMENT,
						},
						docsPath: "/crypto/kzg/verify-blob-kzg-proof-batch#error-handling",
					},
				);
			}
		}
		for (let i = 0; i < proofs.length; i++) {
			const proof = proofs[i];
			if (!(proof instanceof Uint8Array) || proof.length !== BYTES_PER_PROOF) {
				throw new KzgError(
					`Proof at index ${i} must be ${BYTES_PER_PROOF} bytes, got ${proof instanceof Uint8Array ? proof.length : "not Uint8Array"}`,
					{
						code: "KZG_INVALID_PROOF",
						context: {
							index: i,
							proofType:
								proof instanceof Uint8Array ? "Uint8Array" : typeof proof,
							proofLength:
								proof instanceof Uint8Array ? proof.length : undefined,
							expected: BYTES_PER_PROOF,
						},
						docsPath: "/crypto/kzg/verify-blob-kzg-proof-batch#error-handling",
					},
				);
			}
		}
		try {
			return ckzgVerifyBlobKzgProofBatch(blobs, commitments, proofs);
		} catch (error) {
			throw new KzgError(
				`Failed to verify batch: ${error instanceof Error ? error.message : String(error)}`,
				{
					code: "KZG_BATCH_VERIFICATION_FAILED",
					context: { count: blobs.length },
					docsPath: "/crypto/kzg/verify-blob-kzg-proof-batch#error-handling",
					cause: error instanceof Error ? error : undefined,
				},
			);
		}
	};
}
