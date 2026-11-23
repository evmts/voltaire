import {
	BLS_MODULUS,
	BYTES_PER_BLOB,
	BYTES_PER_CELL,
	BYTES_PER_COMMITMENT,
	BYTES_PER_FIELD_ELEMENT,
	BYTES_PER_PROOF,
	CELLS_PER_BLOB,
	CELLS_PER_EXT_BLOB,
} from "./constants.js";
import { KzgError, KzgInvalidBlobError } from "./errors.js";

const DOCS_PATH = "/crypto/kzg#error-handling";

/** BLS_MODULUS as 32 big-endian bytes */
const MODULUS_BYTES = (() => {
	const out = new Uint8Array(BYTES_PER_FIELD_ELEMENT);
	let v = BLS_MODULUS;
	for (let i = BYTES_PER_FIELD_ELEMENT - 1; i >= 0; i--) {
		out[i] = Number(v & 0xffn);
		v >>= 8n;
	}
	return out;
})();

/**
 * Index of the first field element that is not canonical (>= BLS_MODULUS),
 * or -1 when every element is canonical. Inputs are public data.
 *
 * @param {Uint8Array} bytes - Concatenated 32-byte big-endian field elements
 * @returns {number}
 */
function firstNonCanonicalFieldElement(bytes) {
	const count = bytes.length / BYTES_PER_FIELD_ELEMENT;
	for (let element = 0; element < count; element++) {
		const offset = element * BYTES_PER_FIELD_ELEMENT;
		let less = false;
		for (let i = 0; i < BYTES_PER_FIELD_ELEMENT; i++) {
			const byte = /** @type {number} */ (bytes[offset + i]);
			const limit = /** @type {number} */ (MODULUS_BYTES[i]);
			if (byte !== limit) {
				less = byte < limit;
				break;
			}
		}
		if (!less) {
			return element;
		}
	}
	return -1;
}

/**
 * @param {unknown} value
 * @param {string} name
 * @returns {asserts value is unknown[]}
 */
function assertArray(value, name) {
	if (!Array.isArray(value)) {
		throw new KzgError(`${name} must be an array`, {
			code: -32602,
			context: { type: typeof value },
			docsPath: DOCS_PATH,
		});
	}
}

/**
 * @param {unknown} value
 * @param {number} size
 * @param {string} name
 * @returns {asserts value is Uint8Array}
 */
function assertBytes(value, size, name) {
	const isBytes = value instanceof Uint8Array;
	if (isBytes && value.length === size) {
		return;
	}
	throw new KzgError(
		`${name} must be ${size} bytes, got ${isBytes ? value.length : "not Uint8Array"}`,
		{
			code: -32602,
			context: {
				type: isBytes ? "Uint8Array" : typeof value,
				actual: isBytes ? value.length : undefined,
				expected: size,
			},
			docsPath: DOCS_PATH,
		},
	);
}

/**
 * Assert a blob is 131072 bytes of canonical field elements.
 *
 * @param {unknown} blob
 * @returns {asserts blob is Uint8Array}
 * @throws {KzgInvalidBlobError}
 */
export function assertBlob(blob) {
	if (!(blob instanceof Uint8Array)) {
		throw new KzgInvalidBlobError("Blob must be Uint8Array", {
			code: -32602,
			context: { blobType: typeof blob },
			docsPath: "/crypto/kzg/validate-blob#error-handling",
		});
	}
	if (blob.length !== BYTES_PER_BLOB) {
		throw new KzgInvalidBlobError(
			`Blob must be ${BYTES_PER_BLOB} bytes, got ${blob.length}`,
			{
				code: -32602,
				context: { actual: blob.length, expected: BYTES_PER_BLOB },
				docsPath: "/crypto/kzg/validate-blob#error-handling",
			},
		);
	}
	const index = firstNonCanonicalFieldElement(blob);
	if (index !== -1) {
		throw new KzgInvalidBlobError(
			`Invalid field element at index ${index}: must be less than the BLS12-381 scalar modulus`,
			{
				code: -32602,
				context: { index, offset: index * BYTES_PER_FIELD_ELEMENT },
				docsPath: "/crypto/kzg/validate-blob#error-handling",
			},
		);
	}
}

/**
 * Assert every entry is a 2048-byte cell of canonical field elements.
 *
 * @param {unknown} cells
 * @returns {asserts cells is Uint8Array[]}
 * @throws {KzgError}
 */
export function assertCells(cells) {
	assertArray(cells, "Cells");
	for (let i = 0; i < cells.length; i++) {
		const cell = cells[i];
		assertBytes(cell, BYTES_PER_CELL, `Cell at index ${i}`);
		const element = firstNonCanonicalFieldElement(cell);
		if (element !== -1) {
			throw new KzgError(
				`Cell at index ${i} has an invalid field element at index ${element}: must be less than the BLS12-381 scalar modulus`,
				{
					code: -32602,
					context: { index: i, fieldElement: element },
					docsPath: DOCS_PATH,
				},
			);
		}
	}
}

/**
 * Assert every entry is an integer cell index in [0, CELLS_PER_EXT_BLOB).
 *
 * @param {unknown} cellIndices
 * @returns {asserts cellIndices is number[]}
 * @throws {KzgError}
 */
export function assertCellIndices(cellIndices) {
	assertArray(cellIndices, "Cell indices");
	for (let i = 0; i < cellIndices.length; i++) {
		const cellIndex = cellIndices[i];
		if (
			typeof cellIndex === "number" &&
			Number.isInteger(cellIndex) &&
			cellIndex >= 0 &&
			cellIndex < CELLS_PER_EXT_BLOB
		) {
			continue;
		}
		throw new KzgError(
			`Cell index at position ${i} must be an integer in [0, ${CELLS_PER_EXT_BLOB - 1}], got ${String(cellIndex)}`,
			{
				code: -32602,
				context: { position: i, cellIndex: String(cellIndex) },
				docsPath: DOCS_PATH,
			},
		);
	}
}

/**
 * Assert the cell indices are strictly ascending (sorted, no duplicates).
 *
 * @param {number[]} cellIndices
 * @throws {KzgError}
 */
export function assertStrictlyAscending(cellIndices) {
	for (let i = 1; i < cellIndices.length; i++) {
		const previous = /** @type {number} */ (cellIndices[i - 1]);
		const current = /** @type {number} */ (cellIndices[i]);
		if (current > previous) {
			continue;
		}
		throw new KzgError(
			`Cell indices must be strictly ascending: index ${current} at position ${i} follows ${previous}`,
			{
				code: -32602,
				context: { position: i, previous, current },
				docsPath: DOCS_PATH,
			},
		);
	}
}

/**
 * Assert enough cells for recovery: at least half, at most all.
 *
 * @param {number} count
 * @throws {KzgError}
 */
export function assertRecoverableCount(count) {
	if (count >= CELLS_PER_BLOB && count <= CELLS_PER_EXT_BLOB) {
		return;
	}
	throw new KzgError(
		`Recovery needs between ${CELLS_PER_BLOB} and ${CELLS_PER_EXT_BLOB} cells, got ${count}`,
		{
			code: -32602,
			context: { count, min: CELLS_PER_BLOB, max: CELLS_PER_EXT_BLOB },
			docsPath: DOCS_PATH,
		},
	);
}

/**
 * @param {unknown} commitments
 * @returns {asserts commitments is Uint8Array[]}
 * @throws {KzgError}
 */
export function assertCommitments(commitments) {
	assertArray(commitments, "Commitments");
	for (let i = 0; i < commitments.length; i++) {
		assertBytes(
			commitments[i],
			BYTES_PER_COMMITMENT,
			`Commitment at index ${i}`,
		);
	}
}

/**
 * @param {unknown} proofs
 * @returns {asserts proofs is Uint8Array[]}
 * @throws {KzgError}
 */
export function assertProofs(proofs) {
	assertArray(proofs, "Proofs");
	for (let i = 0; i < proofs.length; i++) {
		assertBytes(proofs[i], BYTES_PER_PROOF, `Proof at index ${i}`);
	}
}

/**
 * @param {Record<string, number>} lengths - Array lengths keyed by name
 * @throws {KzgError}
 */
export function assertEqualLengths(lengths) {
	const values = Object.values(lengths);
	if (values.every((length) => length === values[0])) {
		return;
	}
	throw new KzgError(
		`${Object.keys(lengths).join(", ")} must have the same length`,
		{ code: -32602, context: lengths, docsPath: DOCS_PATH },
	);
}

/**
 * Check a backend returned all 128 cells of an extended blob.
 *
 * @param {unknown} cells
 * @returns {Uint8Array[]}
 * @throws {KzgError}
 */
export function expectAllCells(cells) {
	if (
		Array.isArray(cells) &&
		cells.length === CELLS_PER_EXT_BLOB &&
		cells.every(
			(cell) => cell instanceof Uint8Array && cell.length === BYTES_PER_CELL,
		)
	) {
		return cells;
	}
	throw new KzgError(
		`KZG backend must return ${CELLS_PER_EXT_BLOB} cells of ${BYTES_PER_CELL} bytes`,
		{ code: -32000, docsPath: DOCS_PATH },
	);
}

/**
 * Check a backend returned all 128 cells and 128 proofs, as either a
 * `[cells, proofs]` tuple (c-kzg) or a `{ cells, proofs }` object.
 *
 * @param {unknown} result
 * @returns {import('./CellType.js').CellsAndKzgProofs}
 * @throws {KzgError}
 */
export function expectAllCellsAndProofs(result) {
	/** @type {unknown} */
	let cells;
	/** @type {unknown} */
	let proofs;
	if (Array.isArray(result)) {
		[cells, proofs] = result;
	} else if (typeof result === "object" && result !== null) {
		({ cells, proofs } = /** @type {{cells: unknown, proofs: unknown}} */ (
			result
		));
	}
	if (
		Array.isArray(proofs) &&
		proofs.length === CELLS_PER_EXT_BLOB &&
		proofs.every(
			(proof) =>
				proof instanceof Uint8Array && proof.length === BYTES_PER_PROOF,
		)
	) {
		return { cells: expectAllCells(cells), proofs };
	}
	throw new KzgError(
		`KZG backend must return ${CELLS_PER_EXT_BLOB} cells and ${CELLS_PER_EXT_BLOB} proofs of ${BYTES_PER_PROOF} bytes`,
		{ code: -32000, docsPath: DOCS_PATH },
	);
}

/**
 * Wrap a backend failure in a KzgError. KzgErrors pass through untouched.
 *
 * @param {string} action
 * @param {unknown} error
 * @returns {KzgError}
 */
export function backendError(action, error) {
	if (error instanceof KzgError) {
		return error;
	}
	return new KzgError(
		`Failed to ${action}: ${error instanceof Error ? error.message : String(error)}`,
		{
			code: -32000,
			docsPath: DOCS_PATH,
			cause: error instanceof Error ? error : undefined,
		},
	);
}
