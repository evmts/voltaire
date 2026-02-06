/**
 * Factory: Compute KZG proof for blob at evaluation point z
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(blob: Uint8Array, z: Uint8Array) => [Uint8Array, Uint8Array]} deps.computeKzgProof - c-kzg computeKzgProof function
 * @returns {(blob: Uint8Array, z: Uint8Array) => {proof: Uint8Array, y: Uint8Array}} Function that computes KZG proof
 *
 * @example
 * ```typescript
 * import { ComputeKzgProof } from '@tevm/voltaire/crypto/KZG'
 * import * as ckzg from 'c-kzg'
 *
 * const computeKzgProof = ComputeKzgProof({ computeKzgProof: ckzg.computeKzgProof })
 * const { proof, y } = computeKzgProof(blob, z)
 * ```
 */
export function ComputeKzgProof({ computeKzgProof: ckzgComputeKzgProof }: {
    computeKzgProof: (blob: Uint8Array, z: Uint8Array) => [Uint8Array, Uint8Array];
}): (blob: Uint8Array, z: Uint8Array) => {
    proof: Uint8Array;
    y: Uint8Array;
};
//# sourceMappingURL=computeKzgProof.d.ts.map