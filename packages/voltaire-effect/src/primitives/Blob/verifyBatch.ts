/**
 * @module verifyBatch
 * @description Verify batch of KZG proofs for blobs
 * @since 0.1.0
 */
import type { BrandedBlob as BlobNamespace } from "@tevm/voltaire";
import {
	BlobArrayLengthMismatchError,
	BlobNotImplementedError,
	InvalidBlobCountError,
	InvalidBlobSizeError,
	InvalidCommitmentSizeError,
	InvalidProofSizeError,
	MAX_PER_TRANSACTION,
	SIZE,
} from "@tevm/voltaire/Blob";
import { Effect } from "effect";

type BrandedBlob = BlobNamespace.BrandedBlob;
type Commitment = BlobNamespace.Commitment;
type Proof = BlobNamespace.Proof;

type VerifyBatchError =
	| BlobArrayLengthMismatchError
	| InvalidBlobCountError
	| InvalidBlobSizeError
	| InvalidCommitmentSizeError
	| InvalidProofSizeError
	| BlobNotImplementedError;

/**
 * Verify batch of KZG proofs for blobs.
 *
 * Note: Batch verification is not yet implemented. This function validates
 * inputs and throws BlobNotImplementedError.
 *
 * @param blobs - Array of 128KB blobs
 * @param commitments - Array of 48-byte commitments
 * @param proofs - Array of 48-byte proofs
 * @returns Effect failing with BlobNotImplementedError (not yet implemented)
 * @throws {BlobArrayLengthMismatchError} If array lengths don't match
 * @throws {InvalidBlobCountError} If too many blobs
 * @throws {InvalidBlobSizeError} If blob size is invalid
 * @throws {InvalidCommitmentSizeError} If commitment size is invalid
 * @throws {InvalidProofSizeError} If proof size is invalid
 * @throws {BlobNotImplementedError} Always (not yet implemented)
 * @example
 * ```typescript
 * import * as Blob from 'voltaire-effect/primitives/Blob'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Blob.verifyBatch(blobs, commitments, proofs)
 * // Will fail with BlobNotImplementedError
 * ```
 * @since 0.1.0
 */
export const verifyBatch = (
	blobs: readonly BrandedBlob[],
	commitments: readonly Commitment[],
	proofs: readonly Proof[],
): Effect.Effect<boolean, VerifyBatchError> =>
	Effect.try({
		try: (): boolean => {
			if (
				blobs.length !== commitments.length ||
				blobs.length !== proofs.length
			) {
				throw new BlobArrayLengthMismatchError("Arrays must have same length", {
					value: {
						blobs: blobs.length,
						commitments: commitments.length,
						proofs: proofs.length,
					},
					expected: "equal array lengths",
				});
			}
			if (blobs.length > MAX_PER_TRANSACTION) {
				throw new InvalidBlobCountError("Too many blobs", {
					value: blobs.length,
					expected: `max ${MAX_PER_TRANSACTION} blobs`,
				});
			}
			for (let i = 0; i < blobs.length; i++) {
				const blob = blobs[i] as Uint8Array;
				if (blob.length !== SIZE) {
					throw new InvalidBlobSizeError("Invalid blob size", {
						value: blob.length,
						expected: `${SIZE} bytes`,
						context: { index: i },
					});
				}
			}
			for (let i = 0; i < commitments.length; i++) {
				const commitment = commitments[i] as unknown as Uint8Array;
				if (commitment.length !== 48) {
					throw new InvalidCommitmentSizeError("Invalid commitment size", {
						value: commitment.length,
						expected: "48 bytes",
						context: { index: i },
					});
				}
			}
			for (let i = 0; i < proofs.length; i++) {
				const proof = proofs[i] as unknown as Uint8Array;
				if (proof.length !== 48) {
					throw new InvalidProofSizeError("Invalid proof size", {
						value: proof.length,
						expected: "48 bytes",
						context: { index: i },
					});
				}
			}
			throw new BlobNotImplementedError("Not implemented", {
				value: "verifyBatch",
				expected: "implementation",
			});
		},
		catch: (e) => e as VerifyBatchError,
	});
