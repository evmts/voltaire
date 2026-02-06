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
export function VerifyBatch({ verifyBlobKzgProofBatch }: {
    verifyBlobKzgProofBatch: (blobs: Uint8Array[], commitments: Uint8Array[], proofs: Uint8Array[]) => boolean;
}): (blobs: readonly import("./BlobType.js").BrandedBlob[], commitments: readonly import("./BlobType.js").Commitment[], proofs: readonly import("./BlobType.js").Proof[]) => boolean;
//# sourceMappingURL=verifyBatch.d.ts.map