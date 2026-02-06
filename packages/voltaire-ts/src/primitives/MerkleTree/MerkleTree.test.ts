import { describe, expect, it } from "vitest";
import * as Hash from "../Hash/index.js";
import {
	EmptyTreeError,
	from,
	getProof,
	InvalidProofLengthError,
	LeafIndexOutOfBoundsError,
	MerkleTree,
	verify,
} from "./index.js";

describe("MerkleTree", () => {
	describe("from", () => {
		it("creates tree from single leaf", () => {
			const leaf = Hash.keccak256(new Uint8Array([1, 2, 3]));
			const tree = from([leaf]);

			expect(tree.root).toEqual(leaf);
			expect(tree.leafCount).toBe(1);
			expect(tree.depth).toBe(0);
			expect(tree.leaves).toHaveLength(1);
		});

		it("creates tree from two leaves", () => {
			const leaf1 = Hash.keccak256(new Uint8Array([1]));
			const leaf2 = Hash.keccak256(new Uint8Array([2]));
			const tree = from([leaf1, leaf2]);

			expect(tree.leafCount).toBe(2);
			expect(tree.depth).toBe(1);
			expect(tree.root).not.toEqual(leaf1);
			expect(tree.root).not.toEqual(leaf2);
		});

		it("creates tree from four leaves", () => {
			const leaves = [
				Hash.keccak256(new Uint8Array([1])),
				Hash.keccak256(new Uint8Array([2])),
				Hash.keccak256(new Uint8Array([3])),
				Hash.keccak256(new Uint8Array([4])),
			];
			const tree = from(leaves);

			expect(tree.leafCount).toBe(4);
			expect(tree.depth).toBe(2);
		});

		it("handles non-power-of-2 leaf count", () => {
			const leaves = [
				Hash.keccak256(new Uint8Array([1])),
				Hash.keccak256(new Uint8Array([2])),
				Hash.keccak256(new Uint8Array([3])),
			];
			const tree = from(leaves);

			expect(tree.leafCount).toBe(3);
			expect(tree.depth).toBe(2); // ceil(log2(3)) = 2
		});

		it("throws EmptyTreeError for empty leaves", () => {
			expect(() => from([])).toThrow(EmptyTreeError);
		});

		it("returns frozen object", () => {
			const leaf = Hash.keccak256(new Uint8Array([1]));
			const tree = from([leaf]);

			expect(Object.isFrozen(tree)).toBe(true);
			expect(Object.isFrozen(tree.leaves)).toBe(true);
		});
	});

	describe("getProof", () => {
		it("generates proof for single leaf tree", () => {
			const leaf = Hash.keccak256(new Uint8Array([1]));
			const proof = getProof([leaf], 0);

			expect(proof.leaf).toEqual(leaf);
			expect(proof.siblings).toHaveLength(0);
			expect(proof.leafIndex).toBe(0);
			expect(proof.treeDepth).toBe(0);
		});

		it("generates proof for two-leaf tree", () => {
			const leaf1 = Hash.keccak256(new Uint8Array([1]));
			const leaf2 = Hash.keccak256(new Uint8Array([2]));

			const proof0 = getProof([leaf1, leaf2], 0);
			expect(proof0.leaf).toEqual(leaf1);
			expect(proof0.siblings).toHaveLength(1);
			expect(proof0.siblings[0]).toEqual(leaf2);
			expect(proof0.treeDepth).toBe(1);

			const proof1 = getProof([leaf1, leaf2], 1);
			expect(proof1.leaf).toEqual(leaf2);
			expect(proof1.siblings).toHaveLength(1);
			expect(proof1.siblings[0]).toEqual(leaf1);
			expect(proof1.treeDepth).toBe(1);
		});

		it("generates proof for four-leaf tree", () => {
			const leaves = [
				Hash.keccak256(new Uint8Array([1])),
				Hash.keccak256(new Uint8Array([2])),
				Hash.keccak256(new Uint8Array([3])),
				Hash.keccak256(new Uint8Array([4])),
			];

			const proof = getProof(leaves, 0);
			expect(proof.siblings).toHaveLength(2);
			expect(proof.treeDepth).toBe(2);
		});

		it("throws LeafIndexOutOfBoundsError for invalid index", () => {
			const leaves = [Hash.keccak256(new Uint8Array([1]))];

			expect(() => getProof(leaves, 1)).toThrow(LeafIndexOutOfBoundsError);
			expect(() => getProof(leaves, -1)).toThrow(LeafIndexOutOfBoundsError);
		});

		it("throws EmptyTreeError for empty leaves", () => {
			expect(() => getProof([], 0)).toThrow(EmptyTreeError);
		});

		it("returns frozen proof", () => {
			const leaf = Hash.keccak256(new Uint8Array([1]));
			const proof = getProof([leaf], 0);

			expect(Object.isFrozen(proof)).toBe(true);
			expect(Object.isFrozen(proof.siblings)).toBe(true);
		});
	});

	describe("verify", () => {
		it("verifies valid proof for single leaf", () => {
			const leaf = Hash.keccak256(new Uint8Array([1]));
			const tree = from([leaf]);
			const proof = getProof([leaf], 0);

			expect(verify(proof, tree.root)).toBe(true);
		});

		it("verifies valid proof for two leaves", () => {
			const leaf1 = Hash.keccak256(new Uint8Array([1]));
			const leaf2 = Hash.keccak256(new Uint8Array([2]));
			const tree = from([leaf1, leaf2]);

			const proof0 = getProof([leaf1, leaf2], 0);
			expect(verify(proof0, tree.root)).toBe(true);

			const proof1 = getProof([leaf1, leaf2], 1);
			expect(verify(proof1, tree.root)).toBe(true);
		});

		it("verifies valid proof for four leaves", () => {
			const leaves = [
				Hash.keccak256(new Uint8Array([1])),
				Hash.keccak256(new Uint8Array([2])),
				Hash.keccak256(new Uint8Array([3])),
				Hash.keccak256(new Uint8Array([4])),
			];
			const tree = from(leaves);

			for (let i = 0; i < leaves.length; i++) {
				const proof = getProof(leaves, i);
				expect(verify(proof, tree.root)).toBe(true);
			}
		});

		it("rejects proof with wrong root", () => {
			const leaf1 = Hash.keccak256(new Uint8Array([1]));
			const leaf2 = Hash.keccak256(new Uint8Array([2]));
			const proof = getProof([leaf1, leaf2], 0);
			const wrongRoot = Hash.keccak256(new Uint8Array([99]));

			expect(verify(proof, wrongRoot)).toBe(false);
		});

		it("rejects proof with tampered sibling", () => {
			const leaf1 = Hash.keccak256(new Uint8Array([1]));
			const leaf2 = Hash.keccak256(new Uint8Array([2]));
			const tree = from([leaf1, leaf2]);
			const proof = getProof([leaf1, leaf2], 0);

			// Tamper with sibling
			const tamperedProof = {
				...proof,
				siblings: [Hash.keccak256(new Uint8Array([99]))],
			};

			expect(verify(tamperedProof, tree.root)).toBe(false);
		});

		describe("proof length validation (Issue #111)", () => {
			it("throws InvalidProofLengthError when proof is too short", () => {
				const leaf1 = Hash.keccak256(new Uint8Array([1]));
				const leaf2 = Hash.keccak256(new Uint8Array([2]));
				const tree = from([leaf1, leaf2]);

				// Create proof with wrong treeDepth (says depth is 2 but only 1 sibling)
				const invalidProof = {
					leaf: leaf1,
					siblings: [leaf2], // Only 1 sibling
					leafIndex: 0,
					treeDepth: 2, // But claims depth of 2
				};

				expect(() => verify(invalidProof, tree.root)).toThrow(
					InvalidProofLengthError,
				);
			});

			it("throws InvalidProofLengthError when proof is too long", () => {
				const leaf1 = Hash.keccak256(new Uint8Array([1]));
				const leaf2 = Hash.keccak256(new Uint8Array([2]));
				const tree = from([leaf1, leaf2]);

				// Create proof with wrong treeDepth (says depth is 1 but has 2 siblings)
				const invalidProof = {
					leaf: leaf1,
					siblings: [leaf2, Hash.keccak256(new Uint8Array([3]))],
					leafIndex: 0,
					treeDepth: 1, // Claims depth of 1 but has 2 siblings
				};

				expect(() => verify(invalidProof, tree.root)).toThrow(
					InvalidProofLengthError,
				);
			});

			it("validates proof length equals log2(leafCount) for balanced tree", () => {
				// For 8 leaves, depth should be 3 (log2(8) = 3)
				const leaves = Array.from({ length: 8 }, (_, i) =>
					Hash.keccak256(new Uint8Array([i])),
				);
				const tree = from(leaves);

				expect(tree.depth).toBe(3);

				const proof = getProof(leaves, 0);
				expect(proof.siblings.length).toBe(3);
				expect(proof.treeDepth).toBe(3);

				// This should work
				expect(verify(proof, tree.root)).toBe(true);

				// Manipulated proof with wrong depth claim should fail
				const badProof = {
					...proof,
					treeDepth: 4, // Wrong!
				};
				expect(() => verify(badProof, tree.root)).toThrow(
					InvalidProofLengthError,
				);
			});

			it("error message includes expected and actual lengths", () => {
				const leaf = Hash.keccak256(new Uint8Array([1]));
				const invalidProof = {
					leaf,
					siblings: [leaf, leaf],
					leafIndex: 0,
					treeDepth: 1,
				};

				try {
					verify(invalidProof, leaf);
					expect.fail("Should have thrown");
				} catch (e) {
					expect(e).toBeInstanceOf(InvalidProofLengthError);
					const error = e as InstanceType<typeof InvalidProofLengthError>;
					expect(error.expected).toBe(1);
					expect(error.actual).toBe(2);
					expect(error.message).toContain("expected 1");
					expect(error.message).toContain("got 2");
				}
			});

			it("accepts proof with correct depth for unbalanced tree", () => {
				// 5 leaves -> depth 3 (ceil(log2(5)) = 3)
				const leaves = Array.from({ length: 5 }, (_, i) =>
					Hash.keccak256(new Uint8Array([i])),
				);
				const tree = from(leaves);

				expect(tree.depth).toBe(3);

				const proof = getProof(leaves, 0);
				expect(proof.siblings.length).toBe(3);
				expect(proof.treeDepth).toBe(3);

				expect(verify(proof, tree.root)).toBe(true);
			});
		});
	});

	describe("namespace export", () => {
		it("exports all functions on MerkleTree namespace", () => {
			expect(MerkleTree.from).toBe(from);
			expect(MerkleTree.getProof).toBe(getProof);
			expect(MerkleTree.verify).toBe(verify);
		});
	});

	describe("integration", () => {
		it("full workflow: create tree, get proof, verify", () => {
			const data = ["Alice", "Bob", "Charlie", "Dave"];
			const leaves = data.map((s) =>
				Hash.keccak256(new TextEncoder().encode(s)),
			);

			const tree = from(leaves);
			expect(tree.depth).toBe(2);
			expect(tree.leafCount).toBe(4);

			// Verify all leaves
			for (let i = 0; i < leaves.length; i++) {
				const proof = getProof(leaves, i);
				expect(verify(proof, tree.root)).toBe(true);
			}
		});

		it("detects tampered leaves", () => {
			const leaves = [
				Hash.keccak256(new Uint8Array([1])),
				Hash.keccak256(new Uint8Array([2])),
				Hash.keccak256(new Uint8Array([3])),
				Hash.keccak256(new Uint8Array([4])),
			];
			const tree = from(leaves);
			const proof = getProof(leaves, 1);

			// Tamper with the leaf
			const tamperedProof = {
				...proof,
				leaf: Hash.keccak256(new Uint8Array([99])),
			};

			expect(verify(tamperedProof, tree.root)).toBe(false);
		});
	});
});
