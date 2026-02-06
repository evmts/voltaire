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
export function ComputeBlobKzgProof({ computeBlobKzgProof: ckzgComputeBlobKzgProof, }: {
    computeBlobKzgProof: (blob: Uint8Array, commitment: Uint8Array) => Uint8Array;
}): (blob: Uint8Array, commitment: Uint8Array) => Uint8Array;
//# sourceMappingURL=computeBlobKzgProof.d.ts.map