import { KzgError, KzgNotInitializedError } from "./errors.js";
import { getInitialized } from "./loadTrustedSetup.js";
import { validateBlob } from "./validateBlob.js";

/**
 * Factory: Convert blob to KZG commitment
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(blob: Uint8Array) => Uint8Array} deps.blobToKzgCommitment - c-kzg blobToKzgCommitment function
 * @returns {(blob: Uint8Array) => Uint8Array} Function that converts blob to KZG commitment
 *
 * @example
 * ```typescript
 * import { BlobToKzgCommitment } from '@tevm/voltaire/crypto/KZG'
 * import * as ckzg from 'c-kzg'
 *
 * const blobToKzgCommitment = BlobToKzgCommitment({ blobToKzgCommitment: ckzg.blobToKzgCommitment })
 * const commitment = blobToKzgCommitment(blob)
 * ```
 */
export function BlobToKzgCommitment({ blobToKzgCommitment: ckzgBlobToKzgCommitment }) {
	return function blobToKzgCommitment(blob) {
		if (!getInitialized()) {
			throw new KzgNotInitializedError();
		}
		validateBlob(blob);
		try {
			return ckzgBlobToKzgCommitment(blob);
		} catch (error) {
			throw new KzgError(
				`Failed to compute commitment: ${error instanceof Error ? error.message : String(error)}`,
				{
					code: "KZG_COMMITMENT_FAILED",
					context: { blobLength: blob.length },
					docsPath: "/crypto/kzg/blob-to-kzg-commitment#error-handling",
					cause: error instanceof Error ? error : undefined,
				},
			);
		}
	};
}
