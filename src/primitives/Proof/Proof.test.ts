import { describe, expect, it } from "vitest";
import { hash as keccak256 } from "../../crypto/Keccak256/hash.js";
import * as Proof from "./index.js";

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
		// Helper: hash pair of nodes
		function hashPair(left: Uint8Array, right: Uint8Array): Uint8Array {
			const combined = new Uint8Array(64);
			combined.set(left, 0);
			combined.set(right, 32);
			return keccak256(combined);
		}

		it("verifies valid two-leaf tree proof", () => {
			// Build a simple two-leaf Merkle tree
			const leaf0 = new Uint8Array(32).fill(0xaa);
			const leaf1 = new Uint8Array(32).fill(0xbb);

			// Root = keccak256(leaf0 || leaf1)
			const root = hashPair(leaf0, leaf1);

			// Proof for leaf0: sibling is leaf1, position 0
			const proof0 = Proof.from({
				value: leaf0,
				proof: [leaf1],
			});
			expect(Proof.verify(proof0, root, 0)).toBe(true);

			// Proof for leaf1: sibling is leaf0, position 1
			const proof1 = Proof.from({
				value: leaf1,
				proof: [leaf0],
			});
			expect(Proof.verify(proof1, root, 1)).toBe(true);
		});

		it("returns false for invalid proof", () => {
			const leaf = new Uint8Array(32).fill(0xaa);
			const wrongSibling = new Uint8Array(32).fill(0xff);
			const expectedRoot = new Uint8Array(32).fill(0x00);

			const proof = Proof.from({
				value: leaf,
				proof: [wrongSibling],
			});

			expect(Proof.verify(proof, expectedRoot, 0)).toBe(false);
		});

		it("validates empty proof with hash value equals root", () => {
			const root = new Uint8Array(32).fill(0x11);

			const proof = Proof.from({
				value: root,
				proof: [],
			});

			expect(Proof.verify(proof, root, 0)).toBe(true);
		});

		it("returns false for sibling with wrong length", () => {
			const leaf = new Uint8Array(32).fill(0xaa);
			const invalidSibling = new Uint8Array(16).fill(0xbb); // Wrong length
			const root = new Uint8Array(32).fill(0x00);

			const proof = Proof.from({
				value: leaf,
				proof: [invalidSibling],
			});

			expect(Proof.verify(proof, root, 0)).toBe(false);
		});

		it("returns false for root with wrong length", () => {
			const leaf = new Uint8Array(32).fill(0xaa);
			const sibling = new Uint8Array(32).fill(0xbb);
			const invalidRoot = new Uint8Array(16).fill(0x00); // Wrong length

			const proof = Proof.from({
				value: leaf,
				proof: [sibling],
			});

			expect(Proof.verify(proof, invalidRoot, 0)).toBe(false);
		});

		it("throws when proof length doesn't match expected depth", () => {
			const leaf = new Uint8Array(32).fill(0xaa);
			const sibling = new Uint8Array(32).fill(0xbb);
			const root = hashPair(leaf, sibling);

			const proof = Proof.from({
				value: leaf,
				proof: [sibling],
			});

			// Proof has length 1, but we expect depth 3
			expect(() => Proof.verify(proof, root, 0, { expectedDepth: 3 })).toThrow(
				Proof.InvalidProofLengthError,
			);
			expect(() => Proof.verify(proof, root, 0, { expectedDepth: 3 })).toThrow(
				"Proof length 1 does not match expected tree depth 3",
			);
		});

		it("validates proof length matches expected depth", () => {
			const leaf0 = new Uint8Array(32).fill(0xaa);
			const leaf1 = new Uint8Array(32).fill(0xbb);
			const root = hashPair(leaf0, leaf1);

			const proof = Proof.from({
				value: leaf0,
				proof: [leaf1],
			});

			// Proof has length 1, matches expected depth 1
			expect(Proof.verify(proof, root, 0, { expectedDepth: 1 })).toBe(true);
		});

		it("verifies four-leaf tree proof", () => {
			// Build a four-leaf Merkle tree
			const leaf0 = new Uint8Array(32).fill(0xaa);
			const leaf1 = new Uint8Array(32).fill(0xbb);
			const leaf2 = new Uint8Array(32).fill(0xcc);
			const leaf3 = new Uint8Array(32).fill(0xdd);

			// Level 1
			const node01 = hashPair(leaf0, leaf1);
			const node23 = hashPair(leaf2, leaf3);

			// Root
			const root = hashPair(node01, node23);

			// Proof for leaf0: [leaf1, node23], position 0
			const proof0 = Proof.from({
				value: leaf0,
				proof: [leaf1, node23],
			});
			expect(Proof.verify(proof0, root, 0)).toBe(true);

			// Proof for leaf1: [leaf0, node23], position 1
			const proof1 = Proof.from({
				value: leaf1,
				proof: [leaf0, node23],
			});
			expect(Proof.verify(proof1, root, 1)).toBe(true);

			// Proof for leaf2: [leaf3, node01], position 2
			const proof2 = Proof.from({
				value: leaf2,
				proof: [leaf3, node01],
			});
			expect(Proof.verify(proof2, root, 2)).toBe(true);

			// Proof for leaf3: [leaf2, node01], position 3
			const proof3 = Proof.from({
				value: leaf3,
				proof: [leaf2, node01],
			});
			expect(Proof.verify(proof3, root, 3)).toBe(true);
		});

		it("validates expectedDepth for four-leaf tree", () => {
			const leaf0 = new Uint8Array(32).fill(0xaa);
			const leaf1 = new Uint8Array(32).fill(0xbb);
			const leaf2 = new Uint8Array(32).fill(0xcc);
			const leaf3 = new Uint8Array(32).fill(0xdd);

			const node01 = hashPair(leaf0, leaf1);
			const node23 = hashPair(leaf2, leaf3);
			const root = hashPair(node01, node23);

			const proof = Proof.from({
				value: leaf0,
				proof: [leaf1, node23],
			});

			// 4 leaves = depth 2
			expect(Proof.verify(proof, root, 0, { expectedDepth: 2 })).toBe(true);

			// Wrong depth should throw
			expect(() => Proof.verify(proof, root, 0, { expectedDepth: 3 })).toThrow(
				Proof.InvalidProofLengthError,
			);
		});
	});

	describe("computeRoot", () => {
		function hashPair(left: Uint8Array, right: Uint8Array): Uint8Array {
			const combined = new Uint8Array(64);
			combined.set(left, 0);
			combined.set(right, 32);
			return keccak256(combined);
		}

		it("computes correct root for two-leaf tree", () => {
			const leaf0 = new Uint8Array(32).fill(0xaa);
			const leaf1 = new Uint8Array(32).fill(0xbb);
			const expectedRoot = hashPair(leaf0, leaf1);

			const proof = Proof.from({
				value: leaf0,
				proof: [leaf1],
			});

			const computedRoot = Proof.computeRoot(proof, 0);
			expect(computedRoot).toEqual(expectedRoot);
		});

		it("throws when proof length doesn't match expected depth", () => {
			const leaf = new Uint8Array(32).fill(0xaa);
			const sibling = new Uint8Array(32).fill(0xbb);

			const proof = Proof.from({
				value: leaf,
				proof: [sibling],
			});

			expect(() => Proof.computeRoot(proof, 0, { expectedDepth: 3 })).toThrow(
				Proof.InvalidProofLengthError,
			);
		});

		it("returns value for empty proof", () => {
			const value = new Uint8Array(32).fill(0xaa);

			const proof = Proof.from({
				value,
				proof: [],
			});

			const computedRoot = Proof.computeRoot(proof, 0);
			expect(computedRoot).toEqual(value);
		});
	});

	describe("expectedDepth", () => {
		it("returns 0 for 0 or 1 leaves", () => {
			expect(Proof.expectedDepth(0)).toBe(0);
			expect(Proof.expectedDepth(1)).toBe(0);
		});

		it("returns 1 for 2 leaves", () => {
			expect(Proof.expectedDepth(2)).toBe(1);
		});

		it("returns 2 for 3-4 leaves", () => {
			expect(Proof.expectedDepth(3)).toBe(2);
			expect(Proof.expectedDepth(4)).toBe(2);
		});

		it("returns 3 for 5-8 leaves", () => {
			expect(Proof.expectedDepth(5)).toBe(3);
			expect(Proof.expectedDepth(6)).toBe(3);
			expect(Proof.expectedDepth(7)).toBe(3);
			expect(Proof.expectedDepth(8)).toBe(3);
		});

		it("returns 10 for 1000 leaves", () => {
			expect(Proof.expectedDepth(1000)).toBe(10);
		});

		it("returns 10 for 1024 leaves", () => {
			expect(Proof.expectedDepth(1024)).toBe(10);
		});

		it("returns 14 for 10000 leaves", () => {
			expect(Proof.expectedDepth(10000)).toBe(14);
		});
	});

	describe("InvalidProofLengthError", () => {
		it("contains actual and expected values", () => {
			const error = new Proof.InvalidProofLengthError("test", {
				actual: 2,
				expected: 5,
			});

			expect(error.name).toBe("InvalidProofLengthError");
			expect(error.message).toBe("test");
			expect(error.actual).toBe(2);
			expect(error.expected).toBe(5);
		});
	});
});
