/**
 * Factory: Verify a batch of cell KZG proofs (EIP-7594)
 *
 * Entry `i` claims that `cells[i]` is cell number `cellIndices[i]` of the
 * blob committed to by `commitments[i]`, proven by `proofs[i]`. Commitments
 * may repeat (several cells of one blob) and so may indices (the same column
 * of several blobs).
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(commitments: Uint8Array[], cellIndices: number[], cells: Uint8Array[], proofs: Uint8Array[]) => boolean} deps.verifyCellKzgProofBatch - c-kzg verifyCellKzgProofBatch function
 * @param {() => boolean} [deps.isInitialized] - Reports whether the backend's trusted setup is loaded. Defaults to the built-in WASM state.
 * @returns {(commitments: Uint8Array[], cellIndices: number[], cells: Uint8Array[], proofs: Uint8Array[]) => boolean} Function that verifies the batch
 *
 * @example
 * ```typescript
 * import { VerifyCellKzgProofBatch } from '@tevm/voltaire/crypto/KZG'
 * import * as ckzg from 'c-kzg'
 *
 * const verifyCellKzgProofBatch = VerifyCellKzgProofBatch({
 *   verifyCellKzgProofBatch: ckzg.verifyCellKzgProofBatch,
 *   isInitialized: () => true,
 * })
 * const valid = verifyCellKzgProofBatch(commitments, cellIndices, cells, proofs)
 * ```
 */
export function VerifyCellKzgProofBatch({ verifyCellKzgProofBatch: ckzgVerifyCellKzgProofBatch, isInitialized, }: {
    verifyCellKzgProofBatch: (commitments: Uint8Array[], cellIndices: number[], cells: Uint8Array[], proofs: Uint8Array[]) => boolean;
    isInitialized?: (() => boolean) | undefined;
}): (commitments: Uint8Array[], cellIndices: number[], cells: Uint8Array[], proofs: Uint8Array[]) => boolean;
//# sourceMappingURL=verifyCellKzgProofBatch.d.ts.map