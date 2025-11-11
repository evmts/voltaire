import { PrimitiveError } from "../../errors/PrimitiveError.js";
import { InvalidLengthError } from "../../errors/ValidationError.js";
import { SIZE } from "./constants.js";

/**
 * Compute KZG commitment for blob
 *
 * @see https://voltaire.tevm.sh/primitives/blob for Blob documentation
 * @since 0.0.0
 * @param {import('../BrandedBlob.js').BrandedBlob} blob - Blob data
 * @returns {import('../BrandedBlob.js').Commitment} 48-byte KZG commitment
 * @throws {InvalidLengthError} If blob size is invalid
 * @throws {PrimitiveError} If c-kzg-4844 library is not available
 * @example
 * ```javascript
 * import * as Blob from './primitives/Blob/index.js';
 * const commitment = Blob.toCommitment(blob);
 * ```
 *
 * TODO: Implement using c-kzg-4844 library
 * - Load KZG trusted setup
 * - Call blobToKzgCommitment(blob)
 * - Return 48-byte commitment
 */
export function toCommitment(blob) {
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
}
