/**
 * Factory: Verify KZG proof
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(commitment: Uint8Array, z: Uint8Array, y: Uint8Array, proof: Uint8Array) => boolean} deps.verifyKzgProof - c-kzg verifyKzgProof function
 * @returns {(commitment: Uint8Array, z: Uint8Array, y: Uint8Array, proof: Uint8Array) => boolean} Function that verifies KZG proof
 *
 * @example
 * ```typescript
 * import { VerifyKzgProof } from '@tevm/voltaire/crypto/KZG'
 * import * as ckzg from 'c-kzg'
 *
 * const verifyKzgProof = VerifyKzgProof({ verifyKzgProof: ckzg.verifyKzgProof })
 * const valid = verifyKzgProof(commitment, z, y, proof)
 * ```
 */
export function VerifyKzgProof({ verifyKzgProof: ckzgVerifyKzgProof }: {
    verifyKzgProof: (commitment: Uint8Array, z: Uint8Array, y: Uint8Array, proof: Uint8Array) => boolean;
}): (commitment: Uint8Array, z: Uint8Array, y: Uint8Array, proof: Uint8Array) => boolean;
//# sourceMappingURL=verifyKzgProof.d.ts.map