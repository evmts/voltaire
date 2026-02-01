/**
 * Factory: Verify blob KZG proof (optimized for blob verification)
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(blob: Uint8Array, commitment: Uint8Array, proof: Uint8Array) => boolean} deps.verifyBlobKzgProof - c-kzg verifyBlobKzgProof function
 * @returns {(blob: Uint8Array, commitment: Uint8Array, proof: Uint8Array) => boolean} Function that verifies blob KZG proof
 *
 * @example
 * ```typescript
 * import { VerifyBlobKzgProof } from '@tevm/voltaire/crypto/KZG'
 * import * as ckzg from 'c-kzg'
 *
 * const verifyBlobKzgProof = VerifyBlobKzgProof({ verifyBlobKzgProof: ckzg.verifyBlobKzgProof })
 * const valid = verifyBlobKzgProof(blob, commitment, proof)
 * ```
 */
export function VerifyBlobKzgProof({ verifyBlobKzgProof: ckzgVerifyBlobKzgProof, }: {
    verifyBlobKzgProof: (blob: Uint8Array, commitment: Uint8Array, proof: Uint8Array) => boolean;
}): (blob: Uint8Array, commitment: Uint8Array, proof: Uint8Array) => boolean;
//# sourceMappingURL=verifyBlobKzgProof.d.ts.map