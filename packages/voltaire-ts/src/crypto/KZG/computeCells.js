import { KzgNotInitializedError } from "./errors.js";
import { getInitialized } from "./loadTrustedSetup.js";
import {
	assertBlob,
	backendError,
	expectAllCells,
} from "./peerDasValidation.js";

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
export function ComputeCells({
	computeCells: ckzgComputeCells,
	isInitialized = getInitialized,
}) {
	/**
	 * @param {Uint8Array} blob - 131072-byte blob of canonical field elements
	 * @returns {Uint8Array[]} 128 cells of 2048 bytes
	 * @throws {KzgNotInitializedError} If the trusted setup is not loaded
	 * @throws {import('./errors.js').KzgInvalidBlobError} If the blob is malformed
	 * @throws {import('./errors.js').KzgError} If the backend fails
	 */
	return function computeCells(blob) {
		if (!isInitialized()) {
			throw new KzgNotInitializedError();
		}
		assertBlob(blob);
		try {
			return expectAllCells(ckzgComputeCells(blob));
		} catch (error) {
			throw backendError("compute cells", error);
		}
	};
}
