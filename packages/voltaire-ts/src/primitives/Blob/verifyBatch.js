import { InvalidLengthError } from "../errors/index.js";
import { MAX_PER_TRANSACTION, SIZE } from "./constants.js";

/**
 * Validate each item in a batch has the expected byte length
 * @param {readonly Uint8Array[]} items
 * @param {number} expectedSize
 * @param {string} label
 */
function assertBatchSizes(items, expectedSize, label) {
	for (let i = 0; i < items.length; i++) {
		const item = /** @type {Uint8Array} */ (items[i]);
		if (item.length !== expectedSize) {
			throw new InvalidLengthError(
				`Invalid ${label} size at index ${i}: ${item.length}`,
				{
					value: item.length,
					expected: `${expectedSize} bytes`,
					code: -32602,
					docsPath: "/primitives/blob/verify-batch#error-handling",
				},
			);
		}
	}
}

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
				code: -32602,
				docsPath: "/primitives/blob/verify-batch#error-handling",
			});
		}
		if (blobs.length > MAX_PER_TRANSACTION) {
			throw new InvalidLengthError(
				`Too many blobs: ${blobs.length} (max ${MAX_PER_TRANSACTION})`,
				{
					value: blobs.length,
					expected: `<= ${MAX_PER_TRANSACTION}`,
					code: -32602,
					docsPath: "/primitives/blob/verify-batch#error-handling",
				},
			);
		}
		assertBatchSizes(blobs, SIZE, "blob");
		assertBatchSizes(commitments, 48, "commitment");
		assertBatchSizes(proofs, 48, "proof");
		try {
			return verifyBlobKzgProofBatch(
				/** @type {Uint8Array[]} */ ([...blobs]),
				/** @type {Uint8Array[]} */ ([...commitments]),
				/** @type {Uint8Array[]} */ ([...proofs]),
			);
		} catch (_error) {
			// c-kzg throws on invalid proofs rather than returning false
			return false;
		}
	};
}
