import { KzgNotInitializedError } from "./errors.js";
import { getInitialized } from "./loadTrustedSetup.js";
import {
	assertCellIndices,
	assertCells,
	assertCommitments,
	assertEqualLengths,
	assertProofs,
	backendError,
} from "./peerDasValidation.js";

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
export function VerifyCellKzgProofBatch({
	verifyCellKzgProofBatch: ckzgVerifyCellKzgProofBatch,
	isInitialized = getInitialized,
}) {
	/**
	 * @param {Uint8Array[]} commitments - 48-byte commitments, one per cell
	 * @param {number[]} cellIndices - Cell indices in [0, 127], one per cell
	 * @param {Uint8Array[]} cells - 2048-byte cells
	 * @param {Uint8Array[]} proofs - 48-byte proofs, one per cell
	 * @returns {boolean} True if every proof is valid. True for an empty batch.
	 * @throws {KzgNotInitializedError} If the trusted setup is not loaded
	 * @throws {import('./errors.js').KzgError} If inputs are malformed or the backend fails
	 */
	return function verifyCellKzgProofBatch(
		commitments,
		cellIndices,
		cells,
		proofs,
	) {
		if (!isInitialized()) {
			throw new KzgNotInitializedError();
		}
		assertCommitments(commitments);
		assertCellIndices(cellIndices);
		assertCells(cells);
		assertProofs(proofs);
		assertEqualLengths({
			commitments: commitments.length,
			cellIndices: cellIndices.length,
			cells: cells.length,
			proofs: proofs.length,
		});
		// The consensus spec defines the empty batch as valid
		if (cells.length === 0) {
			return true;
		}
		try {
			return (
				ckzgVerifyCellKzgProofBatch(commitments, cellIndices, cells, proofs) ===
				true
			);
		} catch (error) {
			throw backendError("verify cell proof batch", error);
		}
	};
}
