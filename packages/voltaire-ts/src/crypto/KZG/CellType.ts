import type { brand } from "../../brand.js";

/**
 * Branded type for a Cell (EIP-7594 PeerDAS)
 *
 * A cell is 2048 bytes: 64 consecutive field elements of an extended blob.
 * An extended blob has 128 cells.
 *
 * @see https://eips.ethereum.org/EIPS/eip-7594
 * @since 0.0.0
 */
export type CellType = Uint8Array & {
	readonly [brand]: "Cell";
};

/**
 * Index of a cell within an extended blob: an integer in [0, 127]
 *
 * @since 0.0.0
 */
export type CellIndex = number;

/**
 * All 128 cells of an extended blob with their KZG proofs
 *
 * `proofs[i]` proves that `cells[i]` is the evaluation of the blob polynomial
 * over coset `i`.
 *
 * @since 0.0.0
 */
export type CellsAndKzgProofs = {
	cells: Uint8Array[];
	proofs: Uint8Array[];
};

/**
 * Backend functions for EIP-7594, shaped like the `c-kzg` npm package
 *
 * @since 0.0.0
 */
export type PeerDasBackend = {
	computeCells: (blob: Uint8Array) => Uint8Array[];
	computeCellsAndKzgProofs: (
		blob: Uint8Array,
	) => [Uint8Array[], Uint8Array[]] | CellsAndKzgProofs;
	verifyCellKzgProofBatch: (
		commitments: Uint8Array[],
		cellIndices: CellIndex[],
		cells: Uint8Array[],
		proofs: Uint8Array[],
	) => boolean;
	recoverCellsAndKzgProofs: (
		cellIndices: CellIndex[],
		cells: Uint8Array[],
	) => [Uint8Array[], Uint8Array[]] | CellsAndKzgProofs;
};
