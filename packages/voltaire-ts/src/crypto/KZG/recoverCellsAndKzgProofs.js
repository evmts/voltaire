import { KzgNotInitializedError } from "./errors.js";
import { getInitialized } from "./loadTrustedSetup.js";
import {
	assertCellIndices,
	assertCells,
	assertEqualLengths,
	assertRecoverableCount,
	assertStrictlyAscending,
	backendError,
	expectAllCellsAndProofs,
} from "./peerDasValidation.js";

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
export function RecoverCellsAndKzgProofs({
	recoverCellsAndKzgProofs: ckzgRecoverCellsAndKzgProofs,
	isInitialized = getInitialized,
}) {
	/**
	 * @param {number[]} cellIndices - Strictly ascending cell indices in [0, 127]
	 * @param {Uint8Array[]} cells - 2048-byte cells, `cells[i]` at `cellIndices[i]`; between 64 and 128 of them
	 * @returns {{cells: Uint8Array[], proofs: Uint8Array[]}} All 128 cells and 128 proofs
	 * @throws {KzgNotInitializedError} If the trusted setup is not loaded
	 * @throws {import('./errors.js').KzgError} If inputs are malformed or the backend fails
	 */
	return function recoverCellsAndKzgProofs(cellIndices, cells) {
		if (!isInitialized()) {
			throw new KzgNotInitializedError();
		}
		assertCellIndices(cellIndices);
		assertCells(cells);
		assertEqualLengths({
			cellIndices: cellIndices.length,
			cells: cells.length,
		});
		assertRecoverableCount(cells.length);
		assertStrictlyAscending(cellIndices);
		try {
			return expectAllCellsAndProofs(
				ckzgRecoverCellsAndKzgProofs(cellIndices, cells),
			);
		} catch (error) {
			throw backendError("recover cells and proofs", error);
		}
	};
}
