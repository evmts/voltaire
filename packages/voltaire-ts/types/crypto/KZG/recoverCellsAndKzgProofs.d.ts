/**
 * Factory: Recover all 128 cells and proofs from at least 64 cells (EIP-7594)
 *
 * The caller must already trust the provided cells (verify them with
 * `verifyCellKzgProofBatch` first): recovery interpolates whatever it is
 * given.
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(cellIndices: number[], cells: Uint8Array[]) => [Uint8Array[], Uint8Array[]] | {cells: Uint8Array[], proofs: Uint8Array[]}} deps.recoverCellsAndKzgProofs - c-kzg recoverCellsAndKzgProofs function
 * @param {() => boolean} [deps.isInitialized] - Reports whether the backend's trusted setup is loaded. Defaults to the built-in WASM state.
 * @returns {(cellIndices: number[], cells: Uint8Array[]) => {cells: Uint8Array[], proofs: Uint8Array[]}} Function that recovers every cell and proof
 *
 * @example
 * ```typescript
 * import { RecoverCellsAndKzgProofs } from '@tevm/voltaire/crypto/KZG'
 * import * as ckzg from 'c-kzg'
 *
 * const recoverCellsAndKzgProofs = RecoverCellsAndKzgProofs({
 *   recoverCellsAndKzgProofs: ckzg.recoverCellsAndKzgProofs,
 *   isInitialized: () => true,
 * })
 * const { cells, proofs } = recoverCellsAndKzgProofs(cellIndices, partialCells)
 * ```
 */
export function RecoverCellsAndKzgProofs({ recoverCellsAndKzgProofs: ckzgRecoverCellsAndKzgProofs, isInitialized, }: {
    recoverCellsAndKzgProofs: (cellIndices: number[], cells: Uint8Array[]) => [Uint8Array[], Uint8Array[]] | {
        cells: Uint8Array[];
        proofs: Uint8Array[];
    };
    isInitialized?: (() => boolean) | undefined;
}): (cellIndices: number[], cells: Uint8Array[]) => {
    cells: Uint8Array[];
    proofs: Uint8Array[];
};
//# sourceMappingURL=recoverCellsAndKzgProofs.d.ts.map