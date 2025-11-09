import { describe, expect, test } from "vitest";
import * as BinaryTree from "./index.ox.js";
import * as Bytes from "ox/Bytes";

describe("BinaryTree (Ox BinaryStateTree)", () => {
	describe("create", () => {
		test("creates empty binary state tree", () => {
			const tree = BinaryTree.create();
			expect(tree.root.type).toBe("empty");
		});

		test("BinaryTree() factory function creates empty tree", () => {
			const tree = BinaryTree.BinaryTree();
			expect(tree.root.type).toBe("empty");
		});
	});

	describe("insert", () => {
		test("inserts single key-value pair", () => {
			const tree = BinaryTree.create();
			const key = Bytes.fromHex(
				"0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54",
			);
			const value = Bytes.fromHex(
				"0xd4fd4e189132273036449fc9e11198c739161b4c0116a9a2dccdfa1c492006f1",
			);

			BinaryTree.insert(tree, key, value);

			expect(tree.root.type).toBe("stem");
		});

		test("inserts multiple key-value pairs", () => {
			const tree = BinaryTree.create();

			const key1 = Bytes.fromHex(
				"0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54",
			);
			const value1 = Bytes.fromHex(
				"0xd4fd4e189132273036449fc9e11198c739161b4c0116a9a2dccdfa1c492006f1",
			);

			const key2 = Bytes.fromHex(
				"0xf45f299c2a2c5f48f79553620d666638e355f89b4398e8ab426f954g98c9c65",
			);
			const value2 = Bytes.fromHex(
				"0xe5fe5f99fa84e8a1494e5f1049c2d1f843c70f1f7e0f7a93dac4e5f96d3f0f2g2",
			);

			BinaryTree.insert(tree, key1, value1);
			BinaryTree.insert(tree, key2, value2);

			// Tree should grow to internal node structure
			expect(tree.root.type).toMatch(/^(stem|internal)$/);
		});

		test("updates value for existing key", () => {
			const tree = BinaryTree.create();
			const key = Bytes.fromHex(
				"0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54",
			);
			const value1 = Bytes.fromHex(
				"0xd4fd4e189132273036449fc9e11198c739161b4c0116a9a2dccdfa1c492006f1",
			);
			const value2 = Bytes.fromHex(
				"0xa5eaea88eb95f9b2383d5e2038b3d1e743d69e0e7d1e8a82ebd5f6e97e4e1e3f3",
			);

			BinaryTree.insert(tree, key, value1);
			const rootAfterFirst = tree.root;

			BinaryTree.insert(tree, key, value2);
			const rootAfterSecond = tree.root;

			// Root structure should remain same when updating same key
			expect(rootAfterFirst.type).toBe(rootAfterSecond.type);
		});
	});

	describe("merkelize", () => {
		test("computes hash for empty tree", () => {
			const tree = BinaryTree.create();
			const hash = BinaryTree.merkelize(tree);

			expect(hash).toBeInstanceOf(Uint8Array);
			expect(hash.length).toBe(32);
			// Empty tree should produce all-zero hash
			expect(hash.every((byte) => byte === 0)).toBe(true);
		});

		test("computes hash for tree with single entry", () => {
			const tree = BinaryTree.create();
			const key = Bytes.fromHex(
				"0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54",
			);
			const value = Bytes.fromHex(
				"0xd4fd4e189132273036449fc9e11198c739161b4c0116a9a2dccdfa1c492006f1",
			);

			BinaryTree.insert(tree, key, value);
			const hash = BinaryTree.merkelize(tree);

			expect(hash).toBeInstanceOf(Uint8Array);
			expect(hash.length).toBe(32);
			// Should not be all zeros
			expect(hash.some((byte) => byte !== 0)).toBe(true);
		});

		test("computes different hashes for different trees", () => {
			const tree1 = BinaryTree.create();
			const tree2 = BinaryTree.create();

			const key = Bytes.fromHex(
				"0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54",
			);
			const value1 = Bytes.fromHex(
				"0xd4fd4e189132273036449fc9e11198c739161b4c0116a9a2dccdfa1c492006f1",
			);
			const value2 = Bytes.fromHex(
				"0xa5eaea88eb95f9b2383d5e2038b3d1e743d69e0e7d1e8a82ebd5f6e97e4e1e3f3",
			);

			BinaryTree.insert(tree1, key, value1);
			BinaryTree.insert(tree2, key, value2);

			const hash1 = BinaryTree.merkelize(tree1);
			const hash2 = BinaryTree.merkelize(tree2);

			expect(hash1).not.toEqual(hash2);
		});

		test("computes consistent hash for same tree state", () => {
			const tree = BinaryTree.create();
			const key = Bytes.fromHex(
				"0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54",
			);
			const value = Bytes.fromHex(
				"0xd4fd4e189132273036449fc9e11198c739161b4c0116a9a2dccdfa1c492006f1",
			);

			BinaryTree.insert(tree, key, value);

			const hash1 = BinaryTree.merkelize(tree);
			const hash2 = BinaryTree.merkelize(tree);

			expect(hash1).toEqual(hash2);
		});
	});

	describe("namespace pattern", () => {
		test("BinaryTree.create is available", () => {
			expect(BinaryTree.BinaryTree.create).toBe(BinaryTree.create);
		});

		test("BinaryTree.insert is available", () => {
			expect(BinaryTree.BinaryTree.insert).toBe(BinaryTree.insert);
		});

		test("BinaryTree.merkelize is available", () => {
			expect(BinaryTree.BinaryTree.merkelize).toBe(BinaryTree.merkelize);
		});
	});
});
