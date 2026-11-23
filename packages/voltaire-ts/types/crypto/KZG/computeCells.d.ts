/**
 * Factory: Compute all 128 cells of the extended blob (EIP-7594)
 *
 * Cheaper than {@link ComputeCellsAndKzgProofs} when the proofs are not
 * needed.
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(blob: Uint8Array) => Uint8Array[]} deps.computeCells - c-kzg computeCells function
 * @param {() => boolean} [deps.isInitialized] - Reports whether the backend's trusted setup is loaded. Defaults to the built-in WASM state.
 * @returns {(blob: Uint8Array) => Uint8Array[]} Function that returns 128 cells of 2048 bytes
 *
 * @example
 * ```typescript
 * import { ComputeCells } from '@tevm/voltaire/crypto/KZG'
 * import * as ckzg from 'c-kzg'
 *
 * const computeCells = ComputeCells({
 *   computeCells: ckzg.computeCells,
 *   isInitialized: () => true,
 * })
 * const cells = computeCells(blob) // cells.length === 128
 * ```
 */
export function ComputeCells({ computeCells: ckzgComputeCells, isInitialized, }: {
    computeCells: (blob: Uint8Array) => Uint8Array[];
    isInitialized?: (() => boolean) | undefined;
}): (blob: Uint8Array) => Uint8Array[];
//# sourceMappingURL=computeCells.d.ts.map