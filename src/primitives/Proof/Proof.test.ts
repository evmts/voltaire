import { describe, expect, it } from "vitest";
import * as Proof from "./index.js";
import * as Rlp from "../Rlp/index.js";

describe("Proof", () => {
	describe("from", () => {
		it("creates Proof from object", () => {
			const value = new Uint8Array([1, 2, 3, 4]);
			const proofArray = [
				new Uint8Array([5, 6, 7, 8]),
				new Uint8Array([9, 10, 11, 12]),
			];

			const proof = Proof.from({
				value,
				proof: proofArray,
			});

			expect(proof).toBeDefined();
			expect(proof.value).toEqual(value);
			expect(proof.proof).toHaveLength(2);
			expect(proof.proof[0]).toEqual(proofArray[0]);
			expect(proof.proof[1]).toEqual(proofArray[1]);
		});

		it("accepts empty proof array", () => {
			const value = new Uint8Array([1, 2, 3, 4]);

			const proof = Proof.from({
				value,
				proof: [],
			});

			expect(proof.value).toEqual(value);
			expect(proof.proof).toHaveLength(0);
		});

		it("returns immutable object", () => {
			const proof = Proof.from({
				value: new Uint8Array([1, 2, 3]),
				proof: [new Uint8Array([4, 5, 6])],
			});

			expect(Object.isFrozen(proof)).toBe(true);
			expect(Object.isFrozen(proof.proof)).toBe(true);
		});

		it("throws on invalid value type", () => {
			expect(() =>
				Proof.from({
					// @ts-expect-error - testing invalid type
					value: "not a uint8array",
					proof: [],
				}),
			).toThrow("value must be a Uint8Array");
		});

		it("throws on invalid proof type", () => {
			expect(() =>
				Proof.from({
					value: new Uint8Array([1, 2, 3]),
					// @ts-expect-error - testing invalid type
					proof: "not an array",
				}),
			).toThrow("proof must be an array");
		});

		it("throws on invalid proof element type", () => {
			expect(() =>
				Proof.from({
					value: new Uint8Array([1, 2, 3]),
					// @ts-expect-error - testing invalid element type
					proof: [new Uint8Array([4, 5]), "invalid", new Uint8Array([6, 7])],
				}),
			).toThrow("proof[1] must be a Uint8Array");
		});
	});

	describe("equals", () => {
		it("returns true for equal proofs", () => {
			const value = new Uint8Array([1, 2, 3, 4]);
			const proofArray = [
				new Uint8Array([5, 6, 7, 8]),
				new Uint8Array([9, 10, 11, 12]),
			];

			const proof1 = Proof.from({ value, proof: proofArray });
			const proof2 = Proof.from({
				value: new Uint8Array([1, 2, 3, 4]),
				proof: [new Uint8Array([5, 6, 7, 8]), new Uint8Array([9, 10, 11, 12])],
			});

			expect(Proof.equals(proof1, proof2)).toBe(true);
		});

		it("returns false for different values", () => {
			const proof1 = Proof.from({
				value: new Uint8Array([1, 2, 3]),
				proof: [new Uint8Array([4, 5, 6])],
			});
			const proof2 = Proof.from({
				value: new Uint8Array([1, 2, 4]), // Different last byte
				proof: [new Uint8Array([4, 5, 6])],
			});

			expect(Proof.equals(proof1, proof2)).toBe(false);
		});

		it("returns false for different proof lengths", () => {
			const proof1 = Proof.from({
				value: new Uint8Array([1, 2, 3]),
				proof: [new Uint8Array([4, 5, 6])],
			});
			const proof2 = Proof.from({
				value: new Uint8Array([1, 2, 3]),
				proof: [new Uint8Array([4, 5, 6]), new Uint8Array([7, 8, 9])],
			});

			expect(Proof.equals(proof1, proof2)).toBe(false);
		});

		it("returns false for different proof elements", () => {
			const proof1 = Proof.from({
				value: new Uint8Array([1, 2, 3]),
				proof: [new Uint8Array([4, 5, 6])],
			});
			const proof2 = Proof.from({
				value: new Uint8Array([1, 2, 3]),
				proof: [new Uint8Array([4, 5, 7])], // Different last byte
			});

			expect(Proof.equals(proof1, proof2)).toBe(false);
		});

		it("handles empty proofs", () => {
			const proof1 = Proof.from({
				value: new Uint8Array([1, 2, 3]),
				proof: [],
			});
			const proof2 = Proof.from({
				value: new Uint8Array([1, 2, 3]),
				proof: [],
			});

			expect(Proof.equals(proof1, proof2)).toBe(true);
		});
	});

	describe("immutability", () => {
		it("prevents modification of value", () => {
			const value = new Uint8Array([1, 2, 3]);
			const proof = Proof.from({ value, proof: [] });

			// Original array modification shouldn't affect proof
			value[0] = 99;
			expect(proof.value[0]).toBe(1);
		});

		it("prevents modification of proof array", () => {
			const proofArray = [new Uint8Array([1, 2, 3])];
			const proof = Proof.from({
				value: new Uint8Array([4, 5, 6]),
				proof: proofArray,
			});

			// Original array modification shouldn't affect proof
			proofArray.push(new Uint8Array([7, 8, 9]));
			expect(proof.proof).toHaveLength(1);
		});
	});

	describe("verify", () => {
		// Helper to create valid MPT leaf node (2 items: path, value)
		const createLeafNode = (path: Uint8Array, value: Uint8Array) => {
			return Rlp.encodeArray([path, value]);
		};

		// Helper to create valid MPT branch node (17 items: 16 branches + value)
		const createBranchNode = () => {
			const branches: Uint8Array[] = [];
			for (let i = 0; i < 16; i++) {
				branches.push(new Uint8Array([])); // empty branch
			}
			branches.push(new Uint8Array([1, 2, 3])); // value
			return Rlp.encodeArray(branches);
		};

		it("validates proof with valid leaf nodes", () => {
			const leafNode = createLeafNode(
				new Uint8Array([0x20, 0x01]), // leaf path prefix
				new Uint8Array([1, 2, 3, 4]),
			);

			const proof = Proof.from({
				value: new Uint8Array([1, 2, 3, 4]),
				proof: [leafNode],
			});

			const result = Proof.verify(proof);
			expect(result.valid).toBe(true);
		});

		it("validates proof with valid branch nodes", () => {
			const branchNode = createBranchNode();

			const proof = Proof.from({
				value: new Uint8Array([1, 2, 3, 4]),
				proof: [branchNode],
			});

			const result = Proof.verify(proof);
			expect(result.valid).toBe(true);
		});

		it("validates proof with mixed node types", () => {
			const leafNode = createLeafNode(
				new Uint8Array([0x20]),
				new Uint8Array([1, 2, 3]),
			);
			const branchNode = createBranchNode();

			const proof = Proof.from({
				value: new Uint8Array([1, 2, 3]),
				proof: [branchNode, leafNode],
			});

			const result = Proof.verify(proof);
			expect(result.valid).toBe(true);
		});

		it("validates empty proof array", () => {
			const proof = Proof.from({
				value: new Uint8Array([1, 2, 3]),
				proof: [],
			});

			const result = Proof.verify(proof);
			expect(result.valid).toBe(true);
		});

		it("rejects proof with invalid RLP encoding", () => {
			const proof = {
				value: new Uint8Array([1, 2, 3]),
				// Invalid RLP: length prefix says 3 bytes but only 1 byte follows
				proof: [new Uint8Array([0x83, 0x01])],
			};

			const result = Proof.verify(proof);
			expect(result.valid).toBe(false);
			if (!result.valid) {
				expect(result.error.code).toBe("PROOF_NODE_INVALID_RLP");
				expect(result.error.index).toBe(0);
			}
		});

		it("rejects proof with empty node", () => {
			const proof = {
				value: new Uint8Array([1, 2, 3]),
				proof: [new Uint8Array([])],
			};

			const result = Proof.verify(proof);
			expect(result.valid).toBe(false);
			if (!result.valid) {
				expect(result.error.code).toBe("PROOF_NODE_EMPTY");
				expect(result.error.index).toBe(0);
			}
		});

		it("rejects proof node that is not a list", () => {
			// Single byte value (not a list)
			const proof = {
				value: new Uint8Array([1, 2, 3]),
				proof: [new Uint8Array([0x01])],
			};

			const result = Proof.verify(proof);
			expect(result.valid).toBe(false);
			if (!result.valid) {
				expect(result.error.code).toBe("PROOF_NODE_NOT_LIST");
			}
		});

		it("rejects proof node with invalid item count (1 item)", () => {
			// RLP list with 1 item - invalid MPT node
			const invalidNode = Rlp.encodeArray([new Uint8Array([1, 2, 3])]);

			const proof = {
				value: new Uint8Array([1, 2, 3]),
				proof: [invalidNode],
			};

			const result = Proof.verify(proof);
			expect(result.valid).toBe(false);
			if (!result.valid) {
				expect(result.error.code).toBe("PROOF_NODE_INVALID_ITEM_COUNT");
				expect(result.error.message).toContain("1");
				expect(result.error.message).toContain("2 (leaf/extension) or 17 (branch)");
			}
		});

		it("rejects proof node with invalid item count (3 items)", () => {
			// RLP list with 3 items - invalid MPT node
			const invalidNode = Rlp.encodeArray([
				new Uint8Array([1]),
				new Uint8Array([2]),
				new Uint8Array([3]),
			]);

			const proof = {
				value: new Uint8Array([1, 2, 3]),
				proof: [invalidNode],
			};

			const result = Proof.verify(proof);
			expect(result.valid).toBe(false);
			if (!result.valid) {
				expect(result.error.code).toBe("PROOF_NODE_INVALID_ITEM_COUNT");
				expect(result.error.message).toContain("3");
			}
		});

		it("rejects proof node with invalid item count (16 items)", () => {
			// RLP list with 16 items - almost branch but missing value
			const items: Uint8Array[] = [];
			for (let i = 0; i < 16; i++) {
				items.push(new Uint8Array([]));
			}
			const invalidNode = Rlp.encodeArray(items);

			const proof = {
				value: new Uint8Array([1, 2, 3]),
				proof: [invalidNode],
			};

			const result = Proof.verify(proof);
			expect(result.valid).toBe(false);
			if (!result.valid) {
				expect(result.error.code).toBe("PROOF_NODE_INVALID_ITEM_COUNT");
				expect(result.error.message).toContain("16");
			}
		});

		it("rejects null proof", () => {
			const result = Proof.verify(null as any);
			expect(result.valid).toBe(false);
			if (!result.valid) {
				expect(result.error.code).toBe("PROOF_INVALID_INPUT");
			}
		});

		it("rejects proof without proof array", () => {
			const result = Proof.verify({ value: new Uint8Array([1, 2, 3]) } as any);
			expect(result.valid).toBe(false);
			if (!result.valid) {
				expect(result.error.code).toBe("PROOF_MISSING_ARRAY");
			}
		});

		it("rejects proof with non-Uint8Array node", () => {
			const result = Proof.verify({
				value: new Uint8Array([1, 2, 3]),
				proof: ["not a uint8array"],
			} as any);
			expect(result.valid).toBe(false);
			if (!result.valid) {
				expect(result.error.code).toBe("PROOF_NODE_INVALID_TYPE");
				expect(result.error.index).toBe(0);
			}
		});

		it("reports correct index for malformed node in middle of proof", () => {
			const validNode = createLeafNode(
				new Uint8Array([0x20]),
				new Uint8Array([1, 2, 3]),
			);
			// Invalid: single item list
			const invalidNode = Rlp.encodeArray([new Uint8Array([1])]);

			const proof = {
				value: new Uint8Array([1, 2, 3]),
				proof: [validNode, validNode, invalidNode, validNode],
			};

			const result = Proof.verify(proof);
			expect(result.valid).toBe(false);
			if (!result.valid) {
				expect(result.error.index).toBe(2);
			}
		});

		it("exports ProofValidationError", () => {
			expect(Proof.ProofValidationError).toBeDefined();
			const error = new Proof.ProofValidationError("test", { index: 5, code: "TEST" });
			expect(error.name).toBe("ProofValidationError");
			expect(error.index).toBe(5);
			expect(error.code).toBe("TEST");
			expect(error.message).toBe("test");
		});
	});
});
