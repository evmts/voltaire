import { BYTES_PER_COMMITMENT } from "./constants.js";
import { KzgError, KzgNotInitializedError } from "./errors.js";
import { getInitialized } from "./loadTrustedSetup.js";
import { validateBlob } from "./validateBlob.js";

/**
 * Factory: Compute blob KZG proof for a blob given its commitment
 *
 * This is the optimized version for blob verification (EIP-4844).
 * Unlike computeKzgProof which requires an evaluation point z,
 * this function generates a proof that can be used with verifyBlobKzgProof.
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(blob: Uint8Array, commitment: Uint8Array) => Uint8Array} deps.computeBlobKzgProof - c-kzg computeBlobKzgProof function
 * @returns {(blob: Uint8Array, commitment: Uint8Array) => Uint8Array} Function that computes blob KZG proof
 *
 * @example
 * ```typescript
 * import { ComputeBlobKzgProof } from '@tevm/voltaire/crypto/KZG'
 * import * as ckzg from 'c-kzg'
 *
 * const computeBlobKzgProof = ComputeBlobKzgProof({ computeBlobKzgProof: ckzg.computeBlobKzgProof })
 * const commitment = KZG.blobToKzgCommitment(blob)
 * const proof = computeBlobKzgProof(blob, commitment)
 * // Use with verifyBlobKzgProof(blob, commitment, proof)
 * ```
 */
export function ComputeBlobKzgProof({
	computeBlobKzgProof: ckzgComputeBlobKzgProof,
}) {
	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: validation logic
	return function computeBlobKzgProof(blob, commitment) {
		if (!getInitialized()) {
			throw new KzgNotInitializedError();
		}
		validateBlob(blob);
		if (
			!(commitment instanceof Uint8Array) ||
			commitment.length !== BYTES_PER_COMMITMENT
		) {
			throw new KzgError(
				`Commitment must be ${BYTES_PER_COMMITMENT} bytes, got ${commitment instanceof Uint8Array ? commitment.length : "not Uint8Array"}`,
				{
					code: -32602,
					context: {
						commitmentType:
							commitment instanceof Uint8Array
								? "Uint8Array"
								: typeof commitment,
						commitmentLength:
							commitment instanceof Uint8Array ? commitment.length : undefined,
						expected: BYTES_PER_COMMITMENT,
					},
					docsPath: "/crypto/kzg/compute-blob-kzg-proof#error-handling",
				},
			);
		}
		try {
			return ckzgComputeBlobKzgProof(blob, commitment);
		} catch (error) {
			throw new KzgError(
				`Failed to compute blob proof: ${error instanceof Error ? error.message : String(error)}`,
				{
					code: -32000,
					context: {
						blobLength: blob.length,
						commitmentLength: commitment.length,
					},
					docsPath: "/crypto/kzg/compute-blob-kzg-proof#error-handling",
					cause: error instanceof Error ? error : undefined,
				},
			);
		}
	};
}
