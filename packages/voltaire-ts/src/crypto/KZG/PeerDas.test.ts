import { describe, expect, it, vi } from "vitest";
import type { PeerDasBackend } from "./CellType.js";
import {
	BLS_MODULUS,
	BYTES_PER_BLOB,
	BYTES_PER_CELL,
	BYTES_PER_COMMITMENT,
	BYTES_PER_FIELD_ELEMENT,
	BYTES_PER_PROOF,
	CELLS_PER_BLOB,
	CELLS_PER_EXT_BLOB,
	FIELD_ELEMENTS_PER_BLOB,
	FIELD_ELEMENTS_PER_CELL,
	FIELD_ELEMENTS_PER_EXT_BLOB,
} from "./constants.js";
import {
	KzgError,
	KzgInvalidBlobError,
	KzgNotInitializedError,
	KzgNotSupportedError,
} from "./errors.js";
import {
	ComputeCells,
	ComputeCellsAndKzgProofs,
	KZG,
	RecoverCellsAndKzgProofs,
	VerifyCellKzgProofBatch,
} from "./index.js";

const modulusBytes = (() => {
	const out = new Uint8Array(32);
	let v = BLS_MODULUS;
	for (let i = 31; i >= 0; i--) {
		out[i] = Number(v & 0xffn);
		v >>= 8n;
	}
	return out;
})();

const cell = (fill: number): Uint8Array => {
	const out = new Uint8Array(BYTES_PER_CELL).fill(fill);
	// Keep every field element below the BLS modulus (top byte 0x73)
	for (let i = 0; i < FIELD_ELEMENTS_PER_CELL; i++) {
		out[i * BYTES_PER_FIELD_ELEMENT] = 0;
	}
	return out;
};
const allCells = () =>
	Array.from({ length: CELLS_PER_EXT_BLOB }, (_, i) => cell(i));
const allProofs = () =>
	Array.from({ length: CELLS_PER_EXT_BLOB }, (_, i) =>
		new Uint8Array(BYTES_PER_PROOF).fill(i),
	);
const commitment = (fill = 0xc0) =>
	new Uint8Array(BYTES_PER_COMMITMENT).fill(fill);
const proof = (fill = 0xa0) => new Uint8Array(BYTES_PER_PROOF).fill(fill);
const blob = () => new Uint8Array(BYTES_PER_BLOB);
const range = (n: number, start = 0) =>
	Array.from({ length: n }, (_, i) => start + i);

const ready = { isInitialized: () => true };

/** Expect `fn` to throw a KzgError with invalid-params code -32602. */
const expectInvalid = (fn: () => unknown, message?: RegExp) => {
	let thrown: unknown;
	try {
		fn();
	} catch (error) {
		thrown = error;
	}
	expect(thrown).toBeInstanceOf(KzgError);
	expect((thrown as KzgError).code).toBe(-32602);
	if (message) {
		expect((thrown as KzgError).message).toMatch(message);
	}
};

describe("EIP-7594 PeerDAS constants", () => {
	it("match the consensus spec", () => {
		expect(FIELD_ELEMENTS_PER_CELL).toBe(64);
		expect(BYTES_PER_CELL).toBe(2048);
		expect(CELLS_PER_EXT_BLOB).toBe(128);
		expect(CELLS_PER_BLOB).toBe(64);
		expect(FIELD_ELEMENTS_PER_EXT_BLOB).toBe(8192);
	});

	it("are mutually consistent", () => {
		expect(BYTES_PER_CELL).toBe(
			FIELD_ELEMENTS_PER_CELL * BYTES_PER_FIELD_ELEMENT,
		);
		expect(FIELD_ELEMENTS_PER_EXT_BLOB).toBe(2 * FIELD_ELEMENTS_PER_BLOB);
		expect(CELLS_PER_EXT_BLOB).toBe(
			FIELD_ELEMENTS_PER_EXT_BLOB / FIELD_ELEMENTS_PER_CELL,
		);
		expect(CELLS_PER_BLOB).toBe(
			FIELD_ELEMENTS_PER_BLOB / FIELD_ELEMENTS_PER_CELL,
		);
		expect(CELLS_PER_BLOB * BYTES_PER_CELL).toBe(BYTES_PER_BLOB);
	});

	it("BLS_MODULUS is the BLS12-381 scalar field order", () => {
		expect(BLS_MODULUS).toBe(
			52435875175126190479447740508185965837690552500527637822603658699938581184513n,
		);
	});
});

describe("computeCells", () => {
	it("passes the blob to the backend and returns its 128 cells", () => {
		const cells = allCells();
		const backend = vi.fn<PeerDasBackend["computeCells"]>(() => cells);
		const computeCells = ComputeCells({ computeCells: backend, ...ready });
		const input = blob();

		expect(computeCells(input)).toBe(cells);
		expect(backend).toHaveBeenCalledExactlyOnceWith(input);
	});

	it("throws KzgNotInitializedError before touching the backend", () => {
		const backend = vi.fn(() => allCells());
		const computeCells = ComputeCells({
			computeCells: backend,
			isInitialized: () => false,
		});
		expect(() => computeCells(blob())).toThrow(KzgNotInitializedError);
		expect(backend).not.toHaveBeenCalled();
	});

	it("rejects malformed blobs without calling the backend", () => {
		const backend = vi.fn(() => allCells());
		const computeCells = ComputeCells({ computeCells: backend, ...ready });

		// @ts-expect-error testing invalid input
		expect(() => computeCells(null)).toThrow(KzgInvalidBlobError);
		// @ts-expect-error testing invalid input
		expect(() => computeCells(Array.from(blob()))).toThrow(KzgInvalidBlobError);
		expect(() => computeCells(new Uint8Array(BYTES_PER_BLOB - 1))).toThrow(
			KzgInvalidBlobError,
		);
		expect(() => computeCells(new Uint8Array(BYTES_PER_BLOB + 1))).toThrow(
			KzgInvalidBlobError,
		);
		expect(() => computeCells(new Uint8Array(0))).toThrow(KzgInvalidBlobError);
		expect(backend).not.toHaveBeenCalled();
	});

	it("rejects a field element equal to or above the BLS modulus", () => {
		const backend = vi.fn(() => allCells());
		const computeCells = ComputeCells({ computeCells: backend, ...ready });

		const equal = blob();
		equal.set(modulusBytes, 7 * BYTES_PER_FIELD_ELEMENT);
		expect(() => computeCells(equal)).toThrow(/index 7/);

		const above = blob();
		above.fill(0xff, BYTES_PER_BLOB - BYTES_PER_FIELD_ELEMENT);
		expect(() => computeCells(above)).toThrow(/index 4095/);
		expect(backend).not.toHaveBeenCalled();
	});

	it("accepts the largest canonical field element, modulus - 1", () => {
		const backend = vi.fn(() => allCells());
		const computeCells = ComputeCells({ computeCells: backend, ...ready });
		const max = modulusBytes.slice();
		max[31] = (max[31] as number) - 1;
		const input = blob();
		for (let i = 0; i < FIELD_ELEMENTS_PER_BLOB; i++) {
			input.set(max, i * BYTES_PER_FIELD_ELEMENT);
		}
		expect(computeCells(input)).toHaveLength(CELLS_PER_EXT_BLOB);
	});

	it("rejects a backend result that is not 128 cells of 2048 bytes", () => {
		const bad: unknown[] = [
			allCells().slice(1),
			[...allCells(), cell(0)],
			allCells().map((c, i) => (i === 5 ? c.slice(1) : c)),
			undefined,
			"cells",
		];
		for (const result of bad) {
			const computeCells = ComputeCells({
				// @ts-expect-error testing a misbehaving backend
				computeCells: () => result,
				...ready,
			});
			expect(() => computeCells(blob())).toThrow(KzgError);
		}
	});

	it("wraps backend errors in KzgError and keeps the cause", () => {
		const cause = new Error("C_KZG_BADARGS");
		const computeCells = ComputeCells({
			computeCells: () => {
				throw cause;
			},
			...ready,
		});
		let thrown: unknown;
		try {
			computeCells(blob());
		} catch (error) {
			thrown = error;
		}
		expect(thrown).toBeInstanceOf(KzgError);
		expect((thrown as KzgError).message).toContain("C_KZG_BADARGS");
		expect((thrown as KzgError).cause).toBe(cause);
	});
});

describe("computeCellsAndKzgProofs", () => {
	it("normalizes the c-kzg [cells, proofs] tuple", () => {
		const cells = allCells();
		const proofs = allProofs();
		const backend = vi.fn<PeerDasBackend["computeCellsAndKzgProofs"]>(() => [
			cells,
			proofs,
		]);
		const compute = ComputeCellsAndKzgProofs({
			computeCellsAndKzgProofs: backend,
			...ready,
		});
		const input = blob();
		const result = compute(input);

		expect(result.cells).toBe(cells);
		expect(result.proofs).toBe(proofs);
		expect(backend).toHaveBeenCalledExactlyOnceWith(input);
	});

	it("accepts a { cells, proofs } object", () => {
		const cells = allCells();
		const proofs = allProofs();
		const compute = ComputeCellsAndKzgProofs({
			computeCellsAndKzgProofs: () => ({ cells, proofs }),
			...ready,
		});
		expect(compute(blob())).toEqual({ cells, proofs });
	});

	it("requires initialization and a valid blob", () => {
		const backend = vi.fn(() => ({ cells: allCells(), proofs: allProofs() }));
		expect(() =>
			ComputeCellsAndKzgProofs({
				computeCellsAndKzgProofs: backend,
				isInitialized: () => false,
			})(blob()),
		).toThrow(KzgNotInitializedError);
		expect(() =>
			ComputeCellsAndKzgProofs({
				computeCellsAndKzgProofs: backend,
				...ready,
			})(new Uint8Array(100)),
		).toThrow(KzgInvalidBlobError);
		expect(backend).not.toHaveBeenCalled();
	});

	it("rejects a backend result with the wrong proof count or size", () => {
		const bad: unknown[] = [
			[allCells(), allProofs().slice(1)],
			[allCells(), allProofs().map((p, i) => (i === 0 ? p.slice(1) : p))],
			[allCells().slice(1), allProofs()],
			{ cells: allCells() },
			[allCells()],
			null,
		];
		for (const result of bad) {
			const compute = ComputeCellsAndKzgProofs({
				// @ts-expect-error testing a misbehaving backend
				computeCellsAndKzgProofs: () => result,
				...ready,
			});
			expect(() => compute(blob())).toThrow(KzgError);
		}
	});
});

describe("verifyCellKzgProofBatch", () => {
	const make = (result: unknown) => {
		const backend = vi.fn(() => result);
		const verify = VerifyCellKzgProofBatch({
			// @ts-expect-error result is deliberately loosely typed
			verifyCellKzgProofBatch: backend,
			...ready,
		});
		return { backend, verify };
	};

	it("forwards the batch in spec order and returns the backend verdict", () => {
		const commitments = [commitment(1), commitment(1), commitment(2)];
		const indices = [0, 127, 127];
		const cells = [cell(1), cell(2), cell(3)];
		const proofs = [proof(1), proof(2), proof(3)];

		const valid = make(true);
		expect(valid.verify(commitments, indices, cells, proofs)).toBe(true);
		expect(valid.backend).toHaveBeenCalledExactlyOnceWith(
			commitments,
			indices,
			cells,
			proofs,
		);

		expect(make(false).verify(commitments, indices, cells, proofs)).toBe(false);
	});

	it("only a literal true from the backend counts as valid", () => {
		for (const result of [1, "true", {}, undefined, null]) {
			expect(
				make(result).verify([commitment()], [0], [cell(0)], [proof()]),
			).toBe(false);
		}
	});

	it("returns true for the empty batch without calling the backend", () => {
		const { backend, verify } = make(false);
		expect(verify([], [], [], [])).toBe(true);
		expect(backend).not.toHaveBeenCalled();
	});

	it("allows duplicate cell indices and duplicate commitments", () => {
		const { verify } = make(true);
		expect(
			verify(
				[commitment(), commitment()],
				[5, 5],
				[cell(1), cell(1)],
				[proof(), proof()],
			),
		).toBe(true);
	});

	it("throws KzgNotInitializedError before validation", () => {
		const backend = vi.fn(() => true);
		const verify = VerifyCellKzgProofBatch({
			verifyCellKzgProofBatch: backend,
			isInitialized: () => false,
		});
		expect(() => verify([], [], [], [])).toThrow(KzgNotInitializedError);
		expect(backend).not.toHaveBeenCalled();
	});

	it("rejects mismatched array lengths", () => {
		const { backend, verify } = make(true);
		const c = [commitment(), commitment()];
		const i = [0, 1];
		const cs = [cell(0), cell(1)];
		const p = [proof(), proof()];
		expectInvalid(() => verify(c.slice(1), i, cs, p), /same length/);
		expectInvalid(() => verify(c, i.slice(1), cs, p), /same length/);
		expectInvalid(() => verify(c, i, cs.slice(1), p), /same length/);
		expectInvalid(() => verify(c, i, cs, p.slice(1)), /same length/);
		expectInvalid(() => verify([], i, cs, p), /same length/);
		expect(backend).not.toHaveBeenCalled();
	});

	it("rejects out-of-range and non-integer cell indices", () => {
		const { backend, verify } = make(true);
		for (const index of [
			-1,
			CELLS_PER_EXT_BLOB,
			CELLS_PER_EXT_BLOB + 1,
			1.5,
			Number.NaN,
			Number.POSITIVE_INFINITY,
			2 ** 32,
			"0",
			0n,
			null,
			undefined,
		]) {
			expectInvalid(
				// @ts-expect-error testing invalid input
				() => verify([commitment()], [index], [cell(0)], [proof()]),
				/Cell index at position 0/,
			);
		}
		expect(backend).not.toHaveBeenCalled();
	});

	it("accepts the boundary indices 0 and 127", () => {
		const { verify } = make(true);
		for (const index of [0, CELLS_PER_EXT_BLOB - 1]) {
			expect(verify([commitment()], [index], [cell(0)], [proof()])).toBe(true);
		}
	});

	it("rejects wrong commitment, cell, and proof sizes", () => {
		const { backend, verify } = make(true);
		expectInvalid(
			() => verify([new Uint8Array(47)], [0], [cell(0)], [proof()]),
			/Commitment at index 0 must be 48 bytes/,
		);
		expectInvalid(
			() => verify([new Uint8Array(49)], [0], [cell(0)], [proof()]),
			/Commitment at index 0/,
		);
		expectInvalid(
			() => verify([commitment()], [0], [new Uint8Array(2047)], [proof()]),
			/Cell at index 0 must be 2048 bytes/,
		);
		expectInvalid(
			() => verify([commitment()], [0], [new Uint8Array(2049)], [proof()]),
			/Cell at index 0/,
		);
		expectInvalid(
			() => verify([commitment()], [0], [cell(0)], [new Uint8Array(47)]),
			/Proof at index 0 must be 48 bytes/,
		);
		expectInvalid(
			() =>
				verify(
					[commitment(), commitment()],
					[0, 1],
					[cell(0), cell(1)],
					[proof(), new Uint8Array(96)],
				),
			/Proof at index 1/,
		);
		expect(backend).not.toHaveBeenCalled();
	});

	it("rejects a cell with a non-canonical field element", () => {
		const { backend, verify } = make(true);
		const bad = cell(0);
		bad.set(modulusBytes, 63 * BYTES_PER_FIELD_ELEMENT);
		expectInvalid(
			() => verify([commitment()], [0], [bad], [proof()]),
			/invalid field element at index 63/,
		);
		expect(backend).not.toHaveBeenCalled();
	});

	it("rejects non-array and non-Uint8Array inputs", () => {
		const { backend, verify } = make(true);
		// @ts-expect-error testing invalid input
		expectInvalid(() => verify(null, [0], [cell(0)], [proof()]), /array/);
		// @ts-expect-error testing invalid input
		expectInvalid(() => verify([commitment()], 0, [cell(0)], [proof()]));
		// @ts-expect-error testing invalid input
		expectInvalid(() => verify([commitment()], [0], cell(0), [proof()]));
		expectInvalid(() =>
			// @ts-expect-error testing invalid input
			verify([commitment()], [0], [Array.from(cell(0))], [proof()]),
		);
		// @ts-expect-error testing invalid input
		expectInvalid(() => verify([commitment()], [0], [cell(0)], ["proof"]));
		expect(backend).not.toHaveBeenCalled();
	});

	it("wraps backend errors in KzgError", () => {
		const verify = VerifyCellKzgProofBatch({
			verifyCellKzgProofBatch: () => {
				throw new Error("bad point");
			},
			...ready,
		});
		expect(() => verify([commitment()], [0], [cell(0)], [proof()])).toThrow(
			/Failed to verify cell proof batch: bad point/,
		);
	});
});

describe("recoverCellsAndKzgProofs", () => {
	const make = () => {
		const cells = allCells();
		const proofs = allProofs();
		const backend = vi.fn<PeerDasBackend["recoverCellsAndKzgProofs"]>(() => [
			cells,
			proofs,
		]);
		const recover = RecoverCellsAndKzgProofs({
			recoverCellsAndKzgProofs: backend,
			...ready,
		});
		return { backend, recover, cells, proofs };
	};
	const cellsFor = (indices: number[]) => indices.map((i) => cell(i));

	it("recovers from exactly half the cells", () => {
		const { backend, recover, cells, proofs } = make();
		const indices = range(CELLS_PER_BLOB);
		const input = cellsFor(indices);
		const result = recover(indices, input);

		expect(result.cells).toBe(cells);
		expect(result.proofs).toBe(proofs);
		expect(backend).toHaveBeenCalledExactlyOnceWith(indices, input);
	});

	it("accepts the upper half, every other cell, and all 128 cells", () => {
		const { recover } = make();
		for (const indices of [
			range(CELLS_PER_BLOB, CELLS_PER_BLOB),
			range(CELLS_PER_BLOB).map((i) => i * 2),
			range(CELLS_PER_BLOB).map((i) => i * 2 + 1),
			range(CELLS_PER_EXT_BLOB),
		]) {
			expect(recover(indices, cellsFor(indices)).cells).toHaveLength(
				CELLS_PER_EXT_BLOB,
			);
		}
	});

	it("rejects fewer than 64 cells", () => {
		const { backend, recover } = make();
		for (const count of [0, 1, CELLS_PER_BLOB - 1]) {
			const indices = range(count);
			expectInvalid(
				() => recover(indices, cellsFor(indices)),
				/between 64 and 128 cells/,
			);
		}
		expect(backend).not.toHaveBeenCalled();
	});

	it("rejects more than 128 cells", () => {
		const { backend, recover } = make();
		const indices = [...range(CELLS_PER_EXT_BLOB), 0];
		expectInvalid(
			() => recover(indices, cellsFor(indices)),
			/between 64 and 128 cells/,
		);
		expect(backend).not.toHaveBeenCalled();
	});

	it("rejects duplicate indices", () => {
		const { backend, recover } = make();
		const indices = range(CELLS_PER_BLOB);
		indices[10] = 9;
		expectInvalid(
			() => recover(indices, cellsFor(indices)),
			/strictly ascending/,
		);
		expect(backend).not.toHaveBeenCalled();
	});

	it("rejects unsorted indices", () => {
		const { backend, recover } = make();
		const descending = range(CELLS_PER_BLOB).reverse();
		expectInvalid(
			() => recover(descending, cellsFor(descending)),
			/strictly ascending/,
		);
		const swapped = range(CELLS_PER_BLOB);
		[swapped[62], swapped[63]] = [63, 62];
		expectInvalid(() => recover(swapped, cellsFor(swapped)), /position 63/);
		expect(backend).not.toHaveBeenCalled();
	});

	it("rejects out-of-range indices", () => {
		const { backend, recover } = make();
		const high = range(CELLS_PER_BLOB, CELLS_PER_BLOB + 1);
		expectInvalid(() => recover(high, cellsFor(high)), /position 63/);
		const negative = [-1, ...range(CELLS_PER_BLOB - 1)];
		expectInvalid(() => recover(negative, cellsFor(negative)), /position 0/);
		expect(backend).not.toHaveBeenCalled();
	});

	it("rejects mismatched lengths and malformed cells", () => {
		const { backend, recover } = make();
		const indices = range(CELLS_PER_BLOB);
		expectInvalid(
			() => recover(indices, cellsFor(indices).slice(1)),
			/same length/,
		);
		const short = cellsFor(indices);
		short[3] = new Uint8Array(BYTES_PER_CELL - 1);
		expectInvalid(() => recover(indices, short), /Cell at index 3/);
		const nonCanonical = cellsFor(indices);
		(nonCanonical[0] as Uint8Array).set(modulusBytes, 0);
		expectInvalid(
			() => recover(indices, nonCanonical),
			/invalid field element at index 0/,
		);
		expect(backend).not.toHaveBeenCalled();
	});

	it("requires initialization", () => {
		const backend = vi.fn(() => ({ cells: allCells(), proofs: allProofs() }));
		const recover = RecoverCellsAndKzgProofs({
			recoverCellsAndKzgProofs: backend,
			isInitialized: () => false,
		});
		const indices = range(CELLS_PER_BLOB);
		expect(() => recover(indices, cellsFor(indices))).toThrow(
			KzgNotInitializedError,
		);
		expect(backend).not.toHaveBeenCalled();
	});

	it("rejects a short backend result", () => {
		const recover = RecoverCellsAndKzgProofs({
			recoverCellsAndKzgProofs: () => [allCells().slice(1), allProofs()],
			...ready,
		});
		const indices = range(CELLS_PER_BLOB);
		expect(() => recover(indices, cellsFor(indices))).toThrow(KzgError);
	});
});

describe("default KZG PeerDAS API", () => {
	it("is attached to the KZG namespace", () => {
		expect(typeof KZG.computeCells).toBe("function");
		expect(typeof KZG.computeCellsAndKzgProofs).toBe("function");
		expect(typeof KZG.verifyCellKzgProofBatch).toBe("function");
		expect(typeof KZG.recoverCellsAndKzgProofs).toBe("function");
	});

	it("reports not-initialized before anything else", () => {
		if (KZG.isInitialized()) return;
		expect(() => KZG.computeCells(blob())).toThrow(KzgNotInitializedError);
		expect(() => KZG.verifyCellKzgProofBatch([], [], [], [])).toThrow(
			KzgNotInitializedError,
		);
	});
});

describe("built-in WASM backend", () => {
	it("throws KzgNotSupportedError while the loader lacks the cell exports", async () => {
		const { wasmPeerDas } = await import("./peerDasBackend.js");
		const loader: Record<string, unknown> = await import(
			"../../wasm-loader/loader.js"
		);
		for (const name of [
			"kzgComputeCells",
			"kzgComputeCellsAndKzgProofs",
			"kzgVerifyCellKzgProofBatch",
			"kzgRecoverCellsAndKzgProofs",
		]) {
			if (typeof loader[name] === "function") continue;
			expect(() => wasmPeerDas(name)()).toThrow(KzgNotSupportedError);
		}
	});

	it("surfaces KzgNotSupportedError unchanged through a factory", async () => {
		const { wasmPeerDas } = await import("./peerDasBackend.js");
		const computeCells = ComputeCells({
			computeCells: wasmPeerDas("kzgNoSuchPeerDasExport"),
			...ready,
		});
		expect(() => computeCells(blob())).toThrow(KzgNotSupportedError);
	});
});
