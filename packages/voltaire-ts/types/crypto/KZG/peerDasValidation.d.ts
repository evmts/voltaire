/**
 * Assert a blob is 131072 bytes of canonical field elements.
 *
 * @param {unknown} blob
 * @returns {asserts blob is Uint8Array}
 * @throws {KzgInvalidBlobError}
 */
export function assertBlob(blob: unknown): asserts blob is Uint8Array;
/**
 * Assert every entry is a 2048-byte cell of canonical field elements.
 *
 * @param {unknown} cells
 * @returns {asserts cells is Uint8Array[]}
 * @throws {KzgError}
 */
export function assertCells(cells: unknown): asserts cells is Uint8Array[];
/**
 * Assert every entry is an integer cell index in [0, CELLS_PER_EXT_BLOB).
 *
 * @param {unknown} cellIndices
 * @returns {asserts cellIndices is number[]}
 * @throws {KzgError}
 */
export function assertCellIndices(cellIndices: unknown): asserts cellIndices is number[];
/**
 * Assert the cell indices are strictly ascending (sorted, no duplicates).
 *
 * @param {number[]} cellIndices
 * @throws {KzgError}
 */
export function assertStrictlyAscending(cellIndices: number[]): void;
/**
 * Assert enough cells for recovery: at least half, at most all.
 *
 * @param {number} count
 * @throws {KzgError}
 */
export function assertRecoverableCount(count: number): void;
/**
 * @param {unknown} commitments
 * @returns {asserts commitments is Uint8Array[]}
 * @throws {KzgError}
 */
export function assertCommitments(commitments: unknown): asserts commitments is Uint8Array[];
/**
 * @param {unknown} proofs
 * @returns {asserts proofs is Uint8Array[]}
 * @throws {KzgError}
 */
export function assertProofs(proofs: unknown): asserts proofs is Uint8Array[];
/**
 * @param {Record<string, number>} lengths - Array lengths keyed by name
 * @throws {KzgError}
 */
export function assertEqualLengths(lengths: Record<string, number>): void;
/**
 * Check a backend returned all 128 cells of an extended blob.
 *
 * @param {unknown} cells
 * @returns {Uint8Array[]}
 * @throws {KzgError}
 */
export function expectAllCells(cells: unknown): Uint8Array[];
/**
 * Check a backend returned all 128 cells and 128 proofs, as either a
 * `[cells, proofs]` tuple (c-kzg) or a `{ cells, proofs }` object.
 *
 * @param {unknown} result
 * @returns {import('./CellType.js').CellsAndKzgProofs}
 * @throws {KzgError}
 */
export function expectAllCellsAndProofs(result: unknown): import("./CellType.js").CellsAndKzgProofs;
/**
 * Wrap a backend failure in a KzgError. KzgErrors pass through untouched.
 *
 * @param {string} action
 * @param {unknown} error
 * @returns {KzgError}
 */
export function backendError(action: string, error: unknown): KzgError;
import { KzgError } from "./errors.js";
//# sourceMappingURL=peerDasValidation.d.ts.map