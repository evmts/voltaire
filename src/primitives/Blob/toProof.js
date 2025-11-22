import { SIZE } from "./constants.js";

/**
 * Factory: Generate KZG proof for blob
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(blob: Uint8Array, commitment: Uint8Array) => Uint8Array} deps.computeBlobKzgProof - KZG proof function from c-kzg-4844
 * @returns {(blob: import('./BlobType.js').BrandedBlob, commitment: import('./BlobType.js').Commitment) => import('./BlobType.js').Proof} Function that generates KZG proof
 *
 * @see https://voltaire.tevm.sh/primitives/blob for Blob documentation
 * @since 0.0.0
 * @throws {Error} If blob size, commitment size is invalid or c-kzg-4844 library not available
 * @example
 * ```javascript
 * import { ToProof } from './primitives/Blob/index.js';
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
import { PrimitiveError } from "../../errors/PrimitiveError.js";
import { InvalidLengthError } from "../errors/index.js";

export function ToProof({ computeBlobKzgProof }) {
	return function toProof(blob, commitment) {
		if (blob.length !== SIZE) {
			throw new InvalidLengthError(`Invalid blob size: ${blob.length}`, {
				value: blob.length,
				expected: `${SIZE} bytes`,
				code: "BLOB_INVALID_SIZE",
				docsPath: "/primitives/blob/to-proof#error-handling",
			});
		}
		if (commitment.length !== 48) {
			throw new InvalidLengthError(`Invalid commitment size: ${commitment.length}`, {
				value: commitment.length,
				expected: "48 bytes",
				code: "BLOB_INVALID_COMMITMENT_SIZE",
				docsPath: "/primitives/blob/to-proof#error-handling",
			});
		}
		try {
			const proof = computeBlobKzgProof(blob, commitment);
			return proof;
		} catch (error) {
			throw new PrimitiveError(
				`Failed to compute KZG proof: ${error instanceof Error ? error.message : String(error)}`,
				{
					code: "BLOB_KZG_PROOF_FAILED",
					docsPath: "/primitives/blob/to-proof#error-handling",
					cause: error instanceof Error ? error : undefined,
				},
			);
		}
	};
}
