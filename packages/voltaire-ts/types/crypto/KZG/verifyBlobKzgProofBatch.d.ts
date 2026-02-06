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
export function VerifyBlobKzgProofBatch({ verifyBlobKzgProofBatch: ckzgVerifyBlobKzgProofBatch, }: {
    verifyBlobKzgProofBatch: (blobs: Uint8Array[], commitments: Uint8Array[], proofs: Uint8Array[]) => boolean;
}): (blobs: Uint8Array[], commitments: Uint8Array[], proofs: Uint8Array[]) => boolean;
//# sourceMappingURL=verifyBlobKzgProofBatch.d.ts.map