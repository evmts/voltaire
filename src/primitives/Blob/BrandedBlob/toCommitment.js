import { PrimitiveError } from "../../errors/PrimitiveError.js";
import { InvalidLengthError } from "../../errors/ValidationError.js";
import { SIZE } from "./constants.js";

/**
 * Factory: Compute KZG commitment for blob
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(blob: Uint8Array) => Uint8Array} deps.blobToKzgCommitment - KZG commitment function from c-kzg-4844
 * @returns {(blob: import('../BrandedBlob.js').BrandedBlob) => import('../BrandedBlob.js').Commitment} Function that computes KZG commitment
 *
 * @see https://voltaire.tevm.sh/primitives/blob for Blob documentation
 * @since 0.0.0
 * @throws {InvalidLengthError} If blob size is invalid
 * @throws {PrimitiveError} If c-kzg-4844 library is not available
 * @example
 * ```javascript
 * import { ToCommitment } from './primitives/Blob/BrandedBlob/index.js';
 * import { blobToKzgCommitment } from 'c-kzg';
 *
 * const toCommitment = ToCommitment({ blobToKzgCommitment });
 * const commitment = toCommitment(blob);
 * ```
 *
 * TODO: Implement using c-kzg-4844 library
 * - Load KZG trusted setup
 * - Call blobToKzgCommitment(blob)
 * - Return 48-byte commitment
 */
export function ToCommitment({ blobToKzgCommitment }) {
	return function toCommitment(blob) {
		if (blob.length !== SIZE) {
			throw new InvalidLengthError(`Invalid blob size: ${blob.length}`, {
				value: blob.length,
				expected: `${SIZE} bytes`,
				code: "BLOB_INVALID_SIZE",
				docsPath: "/primitives/blob/to-commitment#error-handling",
			});
		}
		// TODO: const commitment = blobToKzgCommitment(blob);
		// TODO: return commitment;
		throw new PrimitiveError("Not implemented: requires c-kzg-4844 library", {
			code: "BLOB_KZG_NOT_IMPLEMENTED",
			docsPath: "/primitives/blob/to-commitment#error-handling",
		});
	};
}
