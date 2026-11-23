/**
 * Factory: Compute all 128 cells of the extended blob and their KZG proofs
 * (EIP-7594)
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(blob: Uint8Array) => [Uint8Array[], Uint8Array[]] | {cells: Uint8Array[], proofs: Uint8Array[]}} deps.computeCellsAndKzgProofs - c-kzg computeCellsAndKzgProofs function
 * @param {() => boolean} [deps.isInitialized] - Reports whether the backend's trusted setup is loaded. Defaults to the built-in WASM state.
 * @returns {(blob: Uint8Array) => {cells: Uint8Array[], proofs: Uint8Array[]}} Function that returns 128 cells and 128 proofs
 *
 * @example
 * ```typescript
 * import { ComputeCellsAndKzgProofs } from '@tevm/voltaire/crypto/KZG'
 * import * as ckzg from 'c-kzg'
 *
 * const computeCellsAndKzgProofs = ComputeCellsAndKzgProofs({
 *   computeCellsAndKzgProofs: ckzg.computeCellsAndKzgProofs,
 *   isInitialized: () => true,
 * })
 * const { cells, proofs } = computeCellsAndKzgProofs(blob)
 * ```
 */
export function ComputeCellsAndKzgProofs({ computeCellsAndKzgProofs: ckzgComputeCellsAndKzgProofs, isInitialized, }: {
    computeCellsAndKzgProofs: (blob: Uint8Array) => [Uint8Array[], Uint8Array[]] | {
        cells: Uint8Array[];
        proofs: Uint8Array[];
    };
    isInitialized?: (() => boolean) | undefined;
}): (blob: Uint8Array) => {
    cells: Uint8Array[];
    proofs: Uint8Array[];
};
//# sourceMappingURL=computeCellsAndKzgProofs.d.ts.map