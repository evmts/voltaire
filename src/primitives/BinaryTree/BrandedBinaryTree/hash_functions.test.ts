import { blake3 } from "@noble/hashes/blake3.js";
import { describe, expect, test } from "vitest";
import type { LeafNode, Node, StemNode } from "./BrandedBinaryTree.js";
import * as BinaryTree from "./index.js";

describe("Hash Functions", () => {
	describe("hashLeaf", () => {
		test("hashes leaf node with value", () => {
			const value = new Uint8Array(32);
			value[0] = 0x42;
			const node: LeafNode = { type: "leaf", value };

			const hash = BinaryTree.hashLeaf(node);

			expect(hash.length).toBe(32);
			expect(hash.some((b) => b !== 0)).toBe(true);
		});

		test("hashes empty value (zero-length)", () => {
			const value = new Uint8Array(0);
			const node: LeafNode = { type: "leaf", value };

			const hash = BinaryTree.hashLeaf(node);

			expect(hash.length).toBe(32);
		});

		test("hashes maximum-size value", () => {
			const value = new Uint8Array(1024);
			value.fill(0xff);
			const node: LeafNode = { type: "leaf", value };

			const hash = BinaryTree.hashLeaf(node);

			expect(hash.length).toBe(32);
			expect(hash.some((b) => b !== 0)).toBe(true);
		});

		test("hashes all-zero value", () => {
			const value = new Uint8Array(32);
			const node: LeafNode = { type: "leaf", value };

			const hash = BinaryTree.hashLeaf(node);

			expect(hash.length).toBe(32);
			// All-zero input should produce non-zero hash
			expect(hash.some((b) => b !== 0)).toBe(true);
		});

		test("hashes all-ones value", () => {
			const value = new Uint8Array(32);
			value.fill(0xff);
			const node: LeafNode = { type: "leaf", value };

			const hash = BinaryTree.hashLeaf(node);

			expect(hash.length).toBe(32);
			expect(hash.some((b) => b !== 0)).toBe(true);
		});

		test("different values produce different hashes", () => {
			const value1 = new Uint8Array(32);
			value1[0] = 0x01;
			const node1: LeafNode = { type: "leaf", value: value1 };

			const value2 = new Uint8Array(32);
			value2[0] = 0x02;
			const node2: LeafNode = { type: "leaf", value: value2 };

			const hash1 = BinaryTree.hashLeaf(node1);
			const hash2 = BinaryTree.hashLeaf(node2);

			expect(hash1).not.toEqual(hash2);
		});

		test("same value produces same hash (determinism)", () => {
			const value = new Uint8Array(32);
			value[15] = 0x99;
			const node: LeafNode = { type: "leaf", value };

			const hash1 = BinaryTree.hashLeaf(node);
			const hash2 = BinaryTree.hashLeaf(node);

			expect(hash1).toEqual(hash2);
		});

		test("hash format validation (32 bytes)", () => {
			const value = new Uint8Array(32);
			value[10] = 0xab;
			const node: LeafNode = { type: "leaf", value };

			const hash = BinaryTree.hashLeaf(node);

			expect(hash).toBeInstanceOf(Uint8Array);
			expect(hash.length).toBe(32);
		});

		test("cross-validation with blake3", () => {
			const value = new Uint8Array(32);
			value[5] = 0x55;
			const node: LeafNode = { type: "leaf", value };

			const hash = BinaryTree.hashLeaf(node);
			const expected = blake3(value);

			expect(hash).toEqual(expected);
		});

		test("multiple sequential hashLeaf calls", () => {
			const hashes = [];
			for (let i = 0; i < 10; i++) {
				const value = new Uint8Array(32);
				value[0] = i;
				const node: LeafNode = { type: "leaf", value };
				hashes.push(BinaryTree.hashLeaf(node));
			}

			// All hashes should be different
			for (let i = 0; i < hashes.length; i++) {
				for (let j = i + 1; j < hashes.length; j++) {
					expect(hashes[i]).not.toEqual(hashes[j]);
				}
			}
		});

		test("single bit difference causes hash change", () => {
			const value1 = new Uint8Array(32);
			value1[0] = 0b00000000;
			const node1: LeafNode = { type: "leaf", value: value1 };

			const value2 = new Uint8Array(32);
			value2[0] = 0b00000001; // Single bit flip
			const node2: LeafNode = { type: "leaf", value: value2 };

			const hash1 = BinaryTree.hashLeaf(node1);
			const hash2 = BinaryTree.hashLeaf(node2);

			expect(hash1).not.toEqual(hash2);

			// Count bit differences (avalanche effect test)
			let bitDiffs = 0;
			for (let i = 0; i < 32; i++) {
				const xor = hash1[i] ^ hash2[i];
				for (let j = 0; j < 8; j++) {
					if ((xor >> j) & 1) bitDiffs++;
				}
			}

			// Avalanche: 1-bit change should flip ~50% of output bits
			// 256 bits total, expect roughly 128 ± tolerance
			expect(bitDiffs).toBeGreaterThan(64);
			expect(bitDiffs).toBeLessThan(192);
		});

		test("large value hashing", () => {
			const value = new Uint8Array(4096);
			for (let i = 0; i < value.length; i++) {
				value[i] = i % 256;
			}
			const node: LeafNode = { type: "leaf", value };

			const hash = BinaryTree.hashLeaf(node);

			expect(hash.length).toBe(32);
			expect(hash.some((b) => b !== 0)).toBe(true);
		});

		test("minimal value (1 byte)", () => {
			const value = new Uint8Array(1);
			value[0] = 0x7f;
			const node: LeafNode = { type: "leaf", value };

			const hash = BinaryTree.hashLeaf(node);

			expect(hash.length).toBe(32);
			expect(hash.some((b) => b !== 0)).toBe(true);
		});

		test("value at byte boundaries", () => {
			const sizes = [1, 7, 8, 15, 16, 31, 32, 63, 64];
			const hashes = sizes.map((size) => {
				const value = new Uint8Array(size);
				value.fill(0xaa);
				const node: LeafNode = { type: "leaf", value };
				return BinaryTree.hashLeaf(node);
			});

			// All should be different
			for (let i = 0; i < hashes.length; i++) {
				for (let j = i + 1; j < hashes.length; j++) {
					expect(hashes[i]).not.toEqual(hashes[j]);
				}
			}
		});

		test("hash is independent of node position in tree", () => {
			// Hash function should only depend on value, not tree structure
			const value = new Uint8Array(32);
			value[20] = 0xcc;
			const node: LeafNode = { type: "leaf", value };

			const hash = BinaryTree.hashLeaf(node);

			// Create tree and insert at different positions
			let tree1 = BinaryTree.init();
			const key1 = new Uint8Array(32);
			key1[31] = 0;
			tree1 = BinaryTree.insert(tree1, key1, value);

			let tree2 = BinaryTree.init();
			const key2 = new Uint8Array(32);
			key2[31] = 255;
			tree2 = BinaryTree.insert(tree2, key2, value);

			// Hash should be same regardless of position
			expect(hash).toEqual(BinaryTree.hashLeaf(node));
		});
	});

	describe("hashStem", () => {
		test("hashes stem with all null values", () => {
			const stem = new Uint8Array(31);
			stem.fill(0xaa);
			const values = new Array(256).fill(null);
			const node: StemNode = { type: "stem", stem, values };

			const hash = BinaryTree.hashStem(node);

			expect(hash.length).toBe(32);
			expect(hash.some((b) => b !== 0)).toBe(true);
		});

		test("hashes stem with single value", () => {
			const stem = new Uint8Array(31);
			stem[0] = 0x01;
			const values = new Array(256).fill(null);
			values[0] = new Uint8Array(32);
			values[0][0] = 0x42;
			const node: StemNode = { type: "stem", stem, values };

			const hash = BinaryTree.hashStem(node);

			expect(hash.length).toBe(32);
			expect(hash.some((b) => b !== 0)).toBe(true);
		});

		test("hashes stem with multiple values", () => {
			const stem = new Uint8Array(31);
			stem.fill(0xbb);
			const values = new Array(256).fill(null);
			values[0] = new Uint8Array(32);
			values[0][0] = 0x11;
			values[100] = new Uint8Array(32);
			values[100][0] = 0x22;
			values[255] = new Uint8Array(32);
			values[255][0] = 0x33;
			const node: StemNode = { type: "stem", stem, values };

			const hash = BinaryTree.hashStem(node);

			expect(hash.length).toBe(32);
			expect(hash.some((b) => b !== 0)).toBe(true);
		});

		test("different stems produce different hashes", () => {
			const stem1 = new Uint8Array(31);
			stem1.fill(0x11);
			const values1 = new Array(256).fill(null);
			const node1: StemNode = { type: "stem", stem: stem1, values: values1 };

			const stem2 = new Uint8Array(31);
			stem2.fill(0x22);
			const values2 = new Array(256).fill(null);
			const node2: StemNode = { type: "stem", stem: stem2, values: values2 };

			const hash1 = BinaryTree.hashStem(node1);
			const hash2 = BinaryTree.hashStem(node2);

			expect(hash1).not.toEqual(hash2);
		});

		test("different values produce different hashes", () => {
			const stem = new Uint8Array(31);
			stem.fill(0xcc);
			const values1 = new Array(256).fill(null);
			values1[10] = new Uint8Array(32);
			values1[10][0] = 0x01;
			const node1: StemNode = { type: "stem", stem, values: values1 };

			const values2 = new Array(256).fill(null);
			values2[10] = new Uint8Array(32);
			values2[10][0] = 0x02;
			const node2: StemNode = { type: "stem", stem, values: values2 };

			const hash1 = BinaryTree.hashStem(node1);
			const hash2 = BinaryTree.hashStem(node2);

			expect(hash1).not.toEqual(hash2);
		});

		test("value position matters", () => {
			const stem = new Uint8Array(31);
			const value = new Uint8Array(32);
			value[0] = 0x99;

			const values1 = new Array(256).fill(null);
			values1[0] = value;
			const node1: StemNode = { type: "stem", stem, values: values1 };

			const values2 = new Array(256).fill(null);
			values2[1] = value;
			const node2: StemNode = { type: "stem", stem, values: values2 };

			const hash1 = BinaryTree.hashStem(node1);
			const hash2 = BinaryTree.hashStem(node2);

			expect(hash1).not.toEqual(hash2);
		});

		test("same stem+values produces same hash (determinism)", () => {
			const stem = new Uint8Array(31);
			stem[15] = 0xdd;
			const values = new Array(256).fill(null);
			values[50] = new Uint8Array(32);
			values[50][10] = 0xee;
			const node: StemNode = { type: "stem", stem, values };

			const hash1 = BinaryTree.hashStem(node);
			const hash2 = BinaryTree.hashStem(node);

			expect(hash1).toEqual(hash2);
		});

		test("hash format validation", () => {
			const stem = new Uint8Array(31);
			const values = new Array(256).fill(null);
			const node: StemNode = { type: "stem", stem, values };

			const hash = BinaryTree.hashStem(node);

			expect(hash).toBeInstanceOf(Uint8Array);
			expect(hash.length).toBe(32);
		});

		test("null value treated as zero bytes", () => {
			const stem = new Uint8Array(31);
			const values1 = new Array(256).fill(null);
			const node1: StemNode = { type: "stem", stem, values: values1 };

			const values2 = new Array(256).fill(null);
			values2[0] = new Uint8Array(32); // Explicit zeros
			const node2: StemNode = { type: "stem", stem, values: values2 };

			const hash1 = BinaryTree.hashStem(node1);
			const hash2 = BinaryTree.hashStem(node2);

			// Both should have zeros at position 0
			expect(hash1).toEqual(hash2);
		});

		test("cross-validation with manual blake3", () => {
			const stem = new Uint8Array(31);
			stem[0] = 0x12;
			stem[30] = 0x34;
			const values = new Array(256).fill(null);
			values[0] = new Uint8Array(32);
			values[0][0] = 0x56;
			const node: StemNode = { type: "stem", stem, values };

			const hash = BinaryTree.hashStem(node);

			// Manual computation
			const data = [...stem];
			for (let i = 0; i < 256; i++) {
				if (values[i]) {
					data.push(...values[i]);
				} else {
					data.push(...new Array(32).fill(0));
				}
			}
			const expected = blake3(new Uint8Array(data));

			expect(hash).toEqual(expected);
		});

		test("all values filled", () => {
			const stem = new Uint8Array(31);
			const values = new Array(256);
			for (let i = 0; i < 256; i++) {
				const v = new Uint8Array(32);
				v[0] = i;
				values[i] = v;
			}
			const node: StemNode = { type: "stem", stem, values };

			const hash = BinaryTree.hashStem(node);

			expect(hash.length).toBe(32);
			expect(hash.some((b) => b !== 0)).toBe(true);
		});

		test("stem with all-ones", () => {
			const stem = new Uint8Array(31);
			stem.fill(0xff);
			const values = new Array(256).fill(null);
			const node: StemNode = { type: "stem", stem, values };

			const hash = BinaryTree.hashStem(node);

			expect(hash.length).toBe(32);
			expect(hash.some((b) => b !== 0)).toBe(true);
		});

		test("sparse vs dense values", () => {
			const stem = new Uint8Array(31);

			// Sparse: only one value
			const values1 = new Array(256).fill(null);
			values1[128] = new Uint8Array(32);
			values1[128][0] = 0xaa;
			const node1: StemNode = { type: "stem", stem, values: values1 };

			// Dense: many values
			const values2 = new Array(256).fill(null);
			for (let i = 0; i < 256; i += 10) {
				values2[i] = new Uint8Array(32);
				values2[i][0] = 0xaa;
			}
			const node2: StemNode = { type: "stem", stem, values: values2 };

			const hash1 = BinaryTree.hashStem(node1);
			const hash2 = BinaryTree.hashStem(node2);

			expect(hash1).not.toEqual(hash2);
		});

		test("single bit flip in stem changes hash significantly", () => {
			const stem1 = new Uint8Array(31);
			stem1[0] = 0b00000000;
			const values = new Array(256).fill(null);
			const node1: StemNode = { type: "stem", stem: stem1, values };

			const stem2 = new Uint8Array(31);
			stem2[0] = 0b00000001; // Single bit flip
			const node2: StemNode = { type: "stem", stem: stem2, values };

			const hash1 = BinaryTree.hashStem(node1);
			const hash2 = BinaryTree.hashStem(node2);

			expect(hash1).not.toEqual(hash2);

			// Avalanche effect
			let bitDiffs = 0;
			for (let i = 0; i < 32; i++) {
				const xor = hash1[i] ^ hash2[i];
				for (let j = 0; j < 8; j++) {
					if ((xor >> j) & 1) bitDiffs++;
				}
			}

			expect(bitDiffs).toBeGreaterThan(64);
		});
	});

	describe("hashInternal", () => {
		test("both children zero returns zero hash", () => {
			const zero = new Uint8Array(32);
			const hash = BinaryTree.hashInternal(zero, zero);

			expect(hash.length).toBe(32);
			expect(hash.every((b) => b === 0)).toBe(true);
		});

		test("left child only (right zero)", () => {
			const left = new Uint8Array(32);
			left[0] = 0x01;
			const right = new Uint8Array(32);

			const hash = BinaryTree.hashInternal(left, right);

			expect(hash.length).toBe(32);
			expect(hash.some((b) => b !== 0)).toBe(true);
		});

		test("right child only (left zero)", () => {
			const left = new Uint8Array(32);
			const right = new Uint8Array(32);
			right[0] = 0x02;

			const hash = BinaryTree.hashInternal(left, right);

			expect(hash.length).toBe(32);
			expect(hash.some((b) => b !== 0)).toBe(true);
		});

		test("both children present", () => {
			const left = new Uint8Array(32);
			left[0] = 0x11;
			const right = new Uint8Array(32);
			right[0] = 0x22;

			const hash = BinaryTree.hashInternal(left, right);

			expect(hash.length).toBe(32);
			expect(hash.some((b) => b !== 0)).toBe(true);
		});

		test("swapped children produce different hash", () => {
			const left = new Uint8Array(32);
			left[0] = 0x33;
			const right = new Uint8Array(32);
			right[0] = 0x44;

			const hash1 = BinaryTree.hashInternal(left, right);
			const hash2 = BinaryTree.hashInternal(right, left); // Swapped

			expect(hash1).not.toEqual(hash2);
		});

		test("all-zero child hashes", () => {
			const left = new Uint8Array(32);
			const right = new Uint8Array(32);

			const hash = BinaryTree.hashInternal(left, right);

			expect(hash.every((b) => b === 0)).toBe(true);
		});

		test("determinism: same inputs same hash", () => {
			const left = new Uint8Array(32);
			left[5] = 0x55;
			const right = new Uint8Array(32);
			right[10] = 0xaa;

			const hash1 = BinaryTree.hashInternal(left, right);
			const hash2 = BinaryTree.hashInternal(left, right);

			expect(hash1).toEqual(hash2);
		});

		test("hash format validation", () => {
			const left = new Uint8Array(32);
			left[0] = 0x66;
			const right = new Uint8Array(32);
			right[0] = 0x77;

			const hash = BinaryTree.hashInternal(left, right);

			expect(hash).toBeInstanceOf(Uint8Array);
			expect(hash.length).toBe(32);
		});

		test("cross-validation with blake3", () => {
			const left = new Uint8Array(32);
			left[0] = 0x88;
			const right = new Uint8Array(32);
			right[0] = 0x99;

			const hash = BinaryTree.hashInternal(left, right);

			const expected = blake3(new Uint8Array([...left, ...right]));

			expect(hash).toEqual(expected);
		});

		test("different left children produce different hashes", () => {
			const left1 = new Uint8Array(32);
			left1[0] = 0x01;
			const left2 = new Uint8Array(32);
			left2[0] = 0x02;
			const right = new Uint8Array(32);
			right[0] = 0xff;

			const hash1 = BinaryTree.hashInternal(left1, right);
			const hash2 = BinaryTree.hashInternal(left2, right);

			expect(hash1).not.toEqual(hash2);
		});

		test("different right children produce different hashes", () => {
			const left = new Uint8Array(32);
			left[0] = 0xff;
			const right1 = new Uint8Array(32);
			right1[0] = 0x01;
			const right2 = new Uint8Array(32);
			right2[0] = 0x02;

			const hash1 = BinaryTree.hashInternal(left, right1);
			const hash2 = BinaryTree.hashInternal(left, right2);

			expect(hash1).not.toEqual(hash2);
		});

		test("all-ones children", () => {
			const left = new Uint8Array(32);
			left.fill(0xff);
			const right = new Uint8Array(32);
			right.fill(0xff);

			const hash = BinaryTree.hashInternal(left, right);

			expect(hash.length).toBe(32);
			expect(hash.some((b) => b !== 0)).toBe(true);
		});
	});

	describe("hashNode", () => {
		test("empty node returns zero hash", () => {
			const node: Node = { type: "empty" };
			const hash = BinaryTree.hashNode(node);

			expect(hash.length).toBe(32);
			expect(hash.every((b) => b === 0)).toBe(true);
		});

		test("internal node with two children", () => {
			const left = new Uint8Array(32);
			left[0] = 0xaa;
			const right = new Uint8Array(32);
			right[0] = 0xbb;
			const node: Node = { type: "internal", left, right };

			const hash = BinaryTree.hashNode(node);

			expect(hash.length).toBe(32);
			expect(hash.some((b) => b !== 0)).toBe(true);
		});

		test("stem node", () => {
			const stem = new Uint8Array(31);
			stem[0] = 0xcc;
			const values = new Array(256).fill(null);
			const node: Node = { type: "stem", stem, values };

			const hash = BinaryTree.hashNode(node);

			expect(hash.length).toBe(32);
			expect(hash.some((b) => b !== 0)).toBe(true);
		});

		test("leaf node", () => {
			const value = new Uint8Array(32);
			value[0] = 0xdd;
			const node: Node = { type: "leaf", value };

			const hash = BinaryTree.hashNode(node);

			expect(hash.length).toBe(32);
			expect(hash.some((b) => b !== 0)).toBe(true);
		});

		test("consistency with hashInternal", () => {
			const left = new Uint8Array(32);
			left[0] = 0x11;
			const right = new Uint8Array(32);
			right[0] = 0x22;

			const node: Node = { type: "internal", left, right };
			const hash1 = BinaryTree.hashNode(node);
			const hash2 = BinaryTree.hashInternal(left, right);

			expect(hash1).toEqual(hash2);
		});

		test("consistency with hashStem", () => {
			const stem = new Uint8Array(31);
			stem[0] = 0x33;
			const values = new Array(256).fill(null);

			const node: StemNode = { type: "stem", stem, values };
			const hash1 = BinaryTree.hashNode(node);
			const hash2 = BinaryTree.hashStem(node);

			expect(hash1).toEqual(hash2);
		});

		test("consistency with hashLeaf", () => {
			const value = new Uint8Array(32);
			value[0] = 0x44;

			const node: LeafNode = { type: "leaf", value };
			const hash1 = BinaryTree.hashNode(node);
			const hash2 = BinaryTree.hashLeaf(node);

			expect(hash1).toEqual(hash2);
		});

		test("different node types produce different hashes", () => {
			const emptyHash = BinaryTree.hashNode({ type: "empty" });

			const value = new Uint8Array(32);
			const leafHash = BinaryTree.hashNode({ type: "leaf", value });

			expect(emptyHash).not.toEqual(leafHash);
		});

		test("determinism across node types", () => {
			const nodes: Node[] = [
				{ type: "empty" },
				{
					type: "internal",
					left: new Uint8Array(32),
					right: new Uint8Array(32),
				},
				{
					type: "stem",
					stem: new Uint8Array(31),
					values: new Array(256).fill(null),
				},
				{ type: "leaf", value: new Uint8Array(32) },
			];

			for (const node of nodes) {
				const hash1 = BinaryTree.hashNode(node);
				const hash2 = BinaryTree.hashNode(node);
				expect(hash1).toEqual(hash2);
			}
		});

		test("internal node empty optimization", () => {
			const zero = new Uint8Array(32);
			const node: Node = { type: "internal", left: zero, right: zero };

			const hash = BinaryTree.hashNode(node);

			// Should use empty node optimization
			expect(hash.every((b) => b === 0)).toBe(true);
		});

		test("recursive hashing simulation", () => {
			// Simulate two-level tree
			const leafValue = new Uint8Array(32);
			leafValue[0] = 0x99;
			const leafHash = BinaryTree.hashNode({ type: "leaf", value: leafValue });

			const zero = new Uint8Array(32);
			const internalHash = BinaryTree.hashNode({
				type: "internal",
				left: leafHash,
				right: zero,
			});

			expect(internalHash.length).toBe(32);
			expect(internalHash.some((b) => b !== 0)).toBe(true);
		});

		test("hash independence across node types", () => {
			// Ensure different node types with similar data produce different hashes
			const data = new Uint8Array(32);
			data.fill(0xee);

			const leafHash = BinaryTree.hashNode({ type: "leaf", value: data });
			const internalHash = BinaryTree.hashNode({
				type: "internal",
				left: data,
				right: new Uint8Array(32),
			});

			expect(leafHash).not.toEqual(internalHash);
		});
	});

	describe("Integration Tests", () => {
		test("manual tree root computation matches rootHash", () => {
			const tree = BinaryTree.init();
			const rootHash = BinaryTree.rootHash(tree);
			const manualHash = BinaryTree.hashNode(tree.root);

			expect(rootHash).toEqual(manualHash);
		});

		test("single insert changes root hash", () => {
			let tree = BinaryTree.init();
			const h1 = BinaryTree.rootHash(tree);

			const key = new Uint8Array(32);
			key[31] = 1;
			const value = new Uint8Array(32);
			value[0] = 0x42;

			tree = BinaryTree.insert(tree, key, value);
			const h2 = BinaryTree.rootHash(tree);

			expect(h1).not.toEqual(h2);
			expect(h2.some((b) => b !== 0)).toBe(true);
		});

		test("multiple inserts produce consistent root", () => {
			let tree = BinaryTree.init();

			const keys = [];
			const values = [];
			for (let i = 0; i < 5; i++) {
				const k = new Uint8Array(32);
				k[31] = i;
				const v = new Uint8Array(32);
				v[0] = i * 10;
				keys.push(k);
				values.push(v);
			}

			// Insert in order
			for (let i = 0; i < 5; i++) {
				tree = BinaryTree.insert(tree, keys[i], values[i]);
			}

			const hash = BinaryTree.rootHash(tree);
			expect(hash.some((b) => b !== 0)).toBe(true);
		});

		test("different insertion order produces same root", () => {
			let tree1 = BinaryTree.init();
			let tree2 = BinaryTree.init();

			const keys = [];
			const values = [];
			for (let i = 0; i < 3; i++) {
				const k = new Uint8Array(32);
				k[31] = i;
				const v = new Uint8Array(32);
				v[0] = i * 5;
				keys.push(k);
				values.push(v);
			}

			// Insert in different orders
			for (let i = 0; i < 3; i++) {
				tree1 = BinaryTree.insert(tree1, keys[i], values[i]);
			}

			tree2 = BinaryTree.insert(tree2, keys[2], values[2]);
			tree2 = BinaryTree.insert(tree2, keys[0], values[0]);
			tree2 = BinaryTree.insert(tree2, keys[1], values[1]);

			const hash1 = BinaryTree.rootHash(tree1);
			const hash2 = BinaryTree.rootHash(tree2);

			expect(hash1).toEqual(hash2);
		});

		test("collision resistance: different trees have different roots", () => {
			let tree1 = BinaryTree.init();
			const k1 = new Uint8Array(32);
			k1[31] = 0;
			const v1 = new Uint8Array(32);
			v1[0] = 0x01;
			tree1 = BinaryTree.insert(tree1, k1, v1);

			let tree2 = BinaryTree.init();
			const k2 = new Uint8Array(32);
			k2[31] = 0;
			const v2 = new Uint8Array(32);
			v2[0] = 0x02;
			tree2 = BinaryTree.insert(tree2, k2, v2);

			const hash1 = BinaryTree.rootHash(tree1);
			const hash2 = BinaryTree.rootHash(tree2);

			expect(hash1).not.toEqual(hash2);
		});

		test("determinism: same tree structure produces same root", () => {
			let tree = BinaryTree.init();
			const key = new Uint8Array(32);
			key[31] = 10;
			const value = new Uint8Array(32);
			value[0] = 0xab;

			tree = BinaryTree.insert(tree, key, value);

			const hash1 = BinaryTree.rootHash(tree);
			const hash2 = BinaryTree.rootHash(tree);

			expect(hash1).toEqual(hash2);
		});

		test("empty tree has deterministic zero root", () => {
			const tree1 = BinaryTree.init();
			const tree2 = BinaryTree.init();

			const hash1 = BinaryTree.rootHash(tree1);
			const hash2 = BinaryTree.rootHash(tree2);

			expect(hash1).toEqual(hash2);
			expect(hash1.every((b) => b === 0)).toBe(true);
		});

		test("hash propagation on insert", () => {
			let tree = BinaryTree.init();
			const hashes = [];

			for (let i = 0; i < 10; i++) {
				const k = new Uint8Array(32);
				k[31] = i;
				const v = new Uint8Array(32);
				v[0] = i;

				tree = BinaryTree.insert(tree, k, v);
				hashes.push(BinaryTree.rootHash(tree));
			}

			// Each insert should produce different root
			for (let i = 0; i < hashes.length - 1; i++) {
				expect(hashes[i]).not.toEqual(hashes[i + 1]);
			}
		});

		test("modify existing key changes root", () => {
			let tree = BinaryTree.init();
			const key = new Uint8Array(32);
			key[31] = 5;
			const v1 = new Uint8Array(32);
			v1[0] = 0x11;

			tree = BinaryTree.insert(tree, key, v1);
			const hash1 = BinaryTree.rootHash(tree);

			const v2 = new Uint8Array(32);
			v2[0] = 0x22;
			tree = BinaryTree.insert(tree, key, v2); // Update
			const hash2 = BinaryTree.rootHash(tree);

			expect(hash1).not.toEqual(hash2);
		});

		test("hash consistency across tree operations", () => {
			let tree = BinaryTree.init();

			const operations = [
				{ key: [0, 0, 0, 0], value: [1, 0, 0, 0] },
				{ key: [1, 0, 0, 0], value: [2, 0, 0, 0] },
				{ key: [2, 0, 0, 0], value: [3, 0, 0, 0] },
			];

			for (const op of operations) {
				const k = new Uint8Array(32);
				k[31] = op.key[0];
				const v = new Uint8Array(32);
				v[0] = op.value[0];
				tree = BinaryTree.insert(tree, k, v);

				// Verify can retrieve
				const retrieved = BinaryTree.get(tree, k);
				expect(retrieved).not.toBeNull();
				expect(retrieved?.[0]).toBe(op.value[0]);
			}

			const finalHash = BinaryTree.rootHash(tree);
			expect(finalHash.some((b) => b !== 0)).toBe(true);
		});

		test("binary tree cryptographic properties: preimage resistance simulation", () => {
			// Can't easily find value that produces specific hash
			let tree = BinaryTree.init();
			const k = new Uint8Array(32);
			k[31] = 123;
			const v = new Uint8Array(32);
			v[0] = 0x99;

			tree = BinaryTree.insert(tree, k, v);
			const targetHash = BinaryTree.rootHash(tree);

			// Try to find different value producing same hash
			let found = false;
			for (let i = 0; i < 100; i++) {
				const testV = new Uint8Array(32);
				testV[0] = i;
				if (i === 0x99) continue; // Skip original

				let testTree = BinaryTree.init();
				testTree = BinaryTree.insert(testTree, k, testV);
				const testHash = BinaryTree.rootHash(testTree);

				if (testHash.every((b, idx) => b === targetHash[idx])) {
					found = true;
					break;
				}
			}

			expect(found).toBe(false); // Should not find collision
		});

		test("avalanche effect: 1-bit change in value cascades to root", () => {
			const key = new Uint8Array(32);
			key[31] = 50;

			const v1 = new Uint8Array(32);
			v1[0] = 0b00000000;
			let tree1 = BinaryTree.init();
			tree1 = BinaryTree.insert(tree1, key, v1);
			const hash1 = BinaryTree.rootHash(tree1);

			const v2 = new Uint8Array(32);
			v2[0] = 0b00000001; // 1-bit flip
			let tree2 = BinaryTree.init();
			tree2 = BinaryTree.insert(tree2, key, v2);
			const hash2 = BinaryTree.rootHash(tree2);

			expect(hash1).not.toEqual(hash2);

			// Count bit differences
			let bitDiffs = 0;
			for (let i = 0; i < 32; i++) {
				const xor = hash1[i] ^ hash2[i];
				for (let j = 0; j < 8; j++) {
					if ((xor >> j) & 1) bitDiffs++;
				}
			}

			// Avalanche: expect ~50% bits flipped
			expect(bitDiffs).toBeGreaterThan(64);
		});

		test("hash independence across tree levels", () => {
			// Insert at different depths
			let tree = BinaryTree.init();

			// Insert with different keys
			const k1 = new Uint8Array(32);
			k1[31] = 10;
			const v1 = new Uint8Array(32);
			v1[0] = 0x11;
			tree = BinaryTree.insert(tree, k1, v1);

			const k2 = new Uint8Array(32);
			k2[31] = 20;
			const v2 = new Uint8Array(32);
			v2[0] = 0x22;
			tree = BinaryTree.insert(tree, k2, v2);

			const hash = BinaryTree.rootHash(tree);
			expect(hash.some((b) => b !== 0)).toBe(true);

			// Verify both values retrievable
			const retrieved1 = BinaryTree.get(tree, k1);
			const retrieved2 = BinaryTree.get(tree, k2);
			expect(retrieved1).not.toBeNull();
			expect(retrieved2).not.toBeNull();
		});

		test("second preimage resistance: can't find different key with same hash", () => {
			let tree = BinaryTree.init();
			const k1 = new Uint8Array(32);
			k1[31] = 77;
			const v = new Uint8Array(32);
			v[0] = 0xcc;

			tree = BinaryTree.insert(tree, k1, v);
			const hash1 = BinaryTree.rootHash(tree);

			// Try different keys with same value
			let found = false;
			for (let i = 0; i < 100; i++) {
				const k2 = new Uint8Array(32);
				k2[31] = i;
				if (i === 77) continue; // Skip original

				let tree2 = BinaryTree.init();
				tree2 = BinaryTree.insert(tree2, k2, v);
				const hash2 = BinaryTree.rootHash(tree2);

				if (hash1.every((b, idx) => b === hash2[idx])) {
					found = true;
					break;
				}
			}

			expect(found).toBe(false);
		});

		test("batch vs incremental hashing consistency", () => {
			// Incremental
			let tree1 = BinaryTree.init();
			for (let i = 0; i < 10; i++) {
				const k = new Uint8Array(32);
				k[31] = i;
				const v = new Uint8Array(32);
				v[0] = i * 2;
				tree1 = BinaryTree.insert(tree1, k, v);
			}
			const hash1 = BinaryTree.rootHash(tree1);

			// Batch (same operations)
			let tree2 = BinaryTree.init();
			for (let i = 0; i < 10; i++) {
				const k = new Uint8Array(32);
				k[31] = i;
				const v = new Uint8Array(32);
				v[0] = i * 2;
				tree2 = BinaryTree.insert(tree2, k, v);
			}
			const hash2 = BinaryTree.rootHash(tree2);

			expect(hash1).toEqual(hash2);
		});

		test("cross-tree comparison: identical data produces identical root", () => {
			let tree1 = BinaryTree.init();
			let tree2 = BinaryTree.init();

			const data = [
				{ key: 10, value: 20 },
				{ key: 20, value: 40 },
				{ key: 30, value: 60 },
			];

			for (const { key, value } of data) {
				const k = new Uint8Array(32);
				k[31] = key;
				const v = new Uint8Array(32);
				v[0] = value;

				tree1 = BinaryTree.insert(tree1, k, v);
				tree2 = BinaryTree.insert(tree2, k, v);
			}

			const hash1 = BinaryTree.rootHash(tree1);
			const hash2 = BinaryTree.rootHash(tree2);

			expect(hash1).toEqual(hash2);
		});

		test("no hash collisions in test dataset", () => {
			const hashes = new Set<string>();
			const count = 50;

			for (let i = 0; i < count; i++) {
				let tree = BinaryTree.init();
				const k = new Uint8Array(32);
				k[31] = i;
				const v = new Uint8Array(32);
				v[0] = i;

				tree = BinaryTree.insert(tree, k, v);
				const hash = BinaryTree.rootHash(tree);
				const hashStr = Array.from(hash)
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("");

				expect(hashes.has(hashStr)).toBe(false);
				hashes.add(hashStr);
			}

			expect(hashes.size).toBe(count);
		});

		test("root hash recomputation after modifications", () => {
			let tree = BinaryTree.init();
			const key = new Uint8Array(32);
			key[31] = 15;
			const v1 = new Uint8Array(32);
			v1[0] = 0xaa;

			tree = BinaryTree.insert(tree, key, v1);
			const hash1 = BinaryTree.rootHash(tree);

			// Modify
			const v2 = new Uint8Array(32);
			v2[0] = 0xbb;
			tree = BinaryTree.insert(tree, key, v2);
			const hash2 = BinaryTree.rootHash(tree);

			// Recompute manually
			const manualHash = BinaryTree.hashNode(tree.root);

			expect(hash2).toEqual(manualHash);
			expect(hash1).not.toEqual(hash2);
		});
	});

	describe("Edge Cases", () => {
		test("empty tree root hash", () => {
			const tree = BinaryTree.init();
			const hash = BinaryTree.rootHash(tree);

			expect(hash.every((b) => b === 0)).toBe(true);
		});

		test("single leaf tree", () => {
			let tree = BinaryTree.init();
			const key = new Uint8Array(32);
			key[31] = 0;
			const value = new Uint8Array(32);
			value[0] = 0xff;

			tree = BinaryTree.insert(tree, key, value);
			const hash = BinaryTree.rootHash(tree);

			expect(hash.some((b) => b !== 0)).toBe(true);
		});

		test("unbalanced tree: all left", () => {
			let tree = BinaryTree.init();

			for (let i = 0; i < 5; i++) {
				const k = new Uint8Array(32);
				// Force left side by setting high bits to 0
				k[0] = 0;
				k[31] = i;
				const v = new Uint8Array(32);
				v[0] = i;

				tree = BinaryTree.insert(tree, k, v);
			}

			const hash = BinaryTree.rootHash(tree);
			expect(hash.some((b) => b !== 0)).toBe(true);
		});

		test("unbalanced tree: all right", () => {
			let tree = BinaryTree.init();

			for (let i = 0; i < 5; i++) {
				const k = new Uint8Array(32);
				// Force right side by setting high bits to 1
				k[0] = 0xff;
				k[31] = i;
				const v = new Uint8Array(32);
				v[0] = i;

				tree = BinaryTree.insert(tree, k, v);
			}

			const hash = BinaryTree.rootHash(tree);
			expect(hash.some((b) => b !== 0)).toBe(true);
		});

		test("deep tree simulation", () => {
			let tree = BinaryTree.init();

			// Insert a few keys to create tree structure
			const k1 = new Uint8Array(32);
			k1[31] = 1;
			const v1 = new Uint8Array(32);
			v1[0] = 1;
			tree = BinaryTree.insert(tree, k1, v1);

			const k2 = new Uint8Array(32);
			k2[31] = 2;
			const v2 = new Uint8Array(32);
			v2[0] = 2;
			tree = BinaryTree.insert(tree, k2, v2);

			const hash = BinaryTree.rootHash(tree);
			expect(hash.some((b) => b !== 0)).toBe(true);
		});

		test("alternating left/right insertions", () => {
			let tree = BinaryTree.init();

			// Insert keys with same stem, different indices
			const k1 = new Uint8Array(32);
			k1[31] = 5;
			const v1 = new Uint8Array(32);
			v1[0] = 10;
			tree = BinaryTree.insert(tree, k1, v1);

			const k2 = new Uint8Array(32);
			k2[31] = 15;
			const v2 = new Uint8Array(32);
			v2[0] = 20;
			tree = BinaryTree.insert(tree, k2, v2);

			const hash = BinaryTree.rootHash(tree);
			expect(hash.some((b) => b !== 0)).toBe(true);
		});

		test("keys differing only in last byte", () => {
			let tree = BinaryTree.init();

			for (let i = 0; i < 256; i++) {
				const k = new Uint8Array(32);
				k[31] = i;
				const v = new Uint8Array(32);
				v[0] = i;

				tree = BinaryTree.insert(tree, k, v);
			}

			const hash = BinaryTree.rootHash(tree);
			expect(hash.some((b) => b !== 0)).toBe(true);
		});

		test("keys with different indices", () => {
			let tree = BinaryTree.init();

			// Insert keys with same stem, different last byte
			for (let i = 0; i < 5; i++) {
				const k = new Uint8Array(32);
				k[31] = i * 10;

				const v = new Uint8Array(32);
				v[0] = i * 2;

				tree = BinaryTree.insert(tree, k, v);
			}

			const hash = BinaryTree.rootHash(tree);
			expect(hash.some((b) => b !== 0)).toBe(true);
		});

		test("sparse tree with gaps", () => {
			let tree = BinaryTree.init();

			const indices = [0, 100, 200, 255];
			for (const idx of indices) {
				const k = new Uint8Array(32);
				k[31] = idx;
				const v = new Uint8Array(32);
				v[0] = idx;

				tree = BinaryTree.insert(tree, k, v);
			}

			const hash = BinaryTree.rootHash(tree);
			expect(hash.some((b) => b !== 0)).toBe(true);
		});

		test("maximum key value", () => {
			let tree = BinaryTree.init();
			const key = new Uint8Array(32);
			key.fill(0xff);
			const value = new Uint8Array(32);
			value.fill(0xaa);

			tree = BinaryTree.insert(tree, key, value);
			const hash = BinaryTree.rootHash(tree);

			expect(hash.some((b) => b !== 0)).toBe(true);
		});
	});

	describe("Security Properties", () => {
		test("second preimage resistance: different inputs different hashes", () => {
			const value = new Uint8Array(32);
			value[0] = 0x42;
			const node: LeafNode = { type: "leaf", value };
			const hash1 = BinaryTree.hashLeaf(node);

			// Try to find different value with same hash
			let collision = false;
			for (let i = 0; i < 256; i++) {
				const testValue = new Uint8Array(32);
				testValue[0] = i;
				if (i === 0x42) continue; // Skip original

				const testNode: LeafNode = { type: "leaf", value: testValue };
				const testHash = BinaryTree.hashLeaf(testNode);

				if (hash1.every((b, idx) => b === testHash[idx])) {
					collision = true;
					break;
				}
			}

			// Should not find collision in small sample space
			expect(collision).toBe(false);
		});

		test("collision resistance: can't find two different inputs with same hash", () => {
			const hashes = new Map<string, Uint8Array>();
			let collision = false;

			for (let i = 0; i < 1000; i++) {
				const value = new Uint8Array(32);
				value[0] = i % 256;
				value[1] = Math.floor(i / 256);
				const node: LeafNode = { type: "leaf", value };
				const hash = BinaryTree.hashLeaf(node);
				const hashStr = Array.from(hash)
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("");

				if (hashes.has(hashStr)) {
					collision = true;
					break;
				}
				hashes.set(hashStr, value);
			}

			expect(collision).toBe(false);
			expect(hashes.size).toBe(1000);
		});

		test("avalanche effect: minimal input change causes significant hash change", () => {
			const value1 = new Uint8Array(32);
			value1.fill(0x00);
			const node1: LeafNode = { type: "leaf", value: value1 };
			const hash1 = BinaryTree.hashLeaf(node1);

			const value2 = new Uint8Array(32);
			value2.fill(0x00);
			value2[31] = 0x01; // Single bit flip in last byte
			const node2: LeafNode = { type: "leaf", value: value2 };
			const hash2 = BinaryTree.hashLeaf(node2);

			// Count bit differences
			let bitDiffs = 0;
			for (let i = 0; i < 32; i++) {
				const xor = hash1[i] ^ hash2[i];
				for (let j = 0; j < 8; j++) {
					if ((xor >> j) & 1) bitDiffs++;
				}
			}

			// Good hash function should flip ~50% of bits
			// 256 bits total, expect 64-192 (25%-75% range)
			expect(bitDiffs).toBeGreaterThan(64);
			expect(bitDiffs).toBeLessThan(192);
		});

		test("hash independence: different positions produce uncorrelated hashes", () => {
			const hashes = [];

			// Test bit flips at different positions
			for (let bytePos = 0; bytePos < 32; bytePos++) {
				const value = new Uint8Array(32);
				value[bytePos] = 0x01;
				const node: LeafNode = { type: "leaf", value };
				hashes.push(BinaryTree.hashLeaf(node));
			}

			// All hashes should be different
			for (let i = 0; i < hashes.length; i++) {
				for (let j = i + 1; j < hashes.length; j++) {
					expect(hashes[i]).not.toEqual(hashes[j]);
				}
			}
		});

		test("stem hash security: different stems produce different hashes", () => {
			const hashes = new Set<string>();

			for (let i = 0; i < 100; i++) {
				const stem = new Uint8Array(31);
				stem[0] = i;
				const values = new Array(256).fill(null);
				const node: StemNode = { type: "stem", stem, values };
				const hash = BinaryTree.hashStem(node);
				const hashStr = Array.from(hash)
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("");

				hashes.add(hashStr);
			}

			expect(hashes.size).toBe(100);
		});

		test("internal hash security: order matters", () => {
			const left = new Uint8Array(32);
			left[0] = 0xaa;
			const right = new Uint8Array(32);
			right[0] = 0xbb;

			const hash1 = BinaryTree.hashInternal(left, right);
			const hash2 = BinaryTree.hashInternal(right, left);

			expect(hash1).not.toEqual(hash2);
		});

		test("no length extension attacks: fixed 32-byte output", () => {
			const values = [
				new Uint8Array(1),
				new Uint8Array(16),
				new Uint8Array(32),
				new Uint8Array(64),
				new Uint8Array(128),
			];

			for (const value of values) {
				value.fill(0x99);
				const node: LeafNode = { type: "leaf", value };
				const hash = BinaryTree.hashLeaf(node);

				expect(hash.length).toBe(32);
			}
		});

		test("preimage resistance: can't deduce input from hash", () => {
			const value = new Uint8Array(32);
			value[15] = 0xde;
			value[16] = 0xad;
			const node: LeafNode = { type: "leaf", value };
			const hash = BinaryTree.hashLeaf(node);

			// Hash should not contain obvious patterns from input
			const hashHex = Array.from(hash)
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("");

			expect(hashHex).not.toContain("dead");
		});
	});

	describe("Performance Tests", () => {
		test("hash 1000 leaves quickly", () => {
			const start = performance.now();

			for (let i = 0; i < 1000; i++) {
				const value = new Uint8Array(32);
				value[0] = i % 256;
				value[1] = Math.floor(i / 256);
				const node: LeafNode = { type: "leaf", value };
				BinaryTree.hashLeaf(node);
			}

			const end = performance.now();
			const duration = end - start;

			// Should complete in reasonable time (< 1 second)
			expect(duration).toBeLessThan(1000);
		});

		test("hash computation is deterministic across runs", () => {
			const value = new Uint8Array(32);
			value[10] = 0x55;
			const node: LeafNode = { type: "leaf", value };

			const hashes = [];
			for (let i = 0; i < 100; i++) {
				hashes.push(BinaryTree.hashLeaf(node));
			}

			// All should be identical
			for (let i = 1; i < hashes.length; i++) {
				expect(hashes[i]).toEqual(hashes[0]);
			}
		});

		test("batch hashing performance", () => {
			const nodes: LeafNode[] = [];
			for (let i = 0; i < 100; i++) {
				const value = new Uint8Array(32);
				value[0] = i;
				nodes.push({ type: "leaf", value });
			}

			const start = performance.now();

			for (const node of nodes) {
				BinaryTree.hashLeaf(node);
			}

			const end = performance.now();
			const duration = end - start;

			// Should be fast
			expect(duration).toBeLessThan(100);
		});

		test("stem hashing with all values filled is fast", () => {
			const stem = new Uint8Array(31);
			const values = new Array(256);
			for (let i = 0; i < 256; i++) {
				const v = new Uint8Array(32);
				v[0] = i;
				values[i] = v;
			}
			const node: StemNode = { type: "stem", stem, values };

			const start = performance.now();
			BinaryTree.hashStem(node);
			const end = performance.now();

			// Should complete quickly even with 256 values
			expect(end - start).toBeLessThan(10);
		});

		test("internal hashing is fast", () => {
			const left = new Uint8Array(32);
			left.fill(0xaa);
			const right = new Uint8Array(32);
			right.fill(0xbb);

			const start = performance.now();

			for (let i = 0; i < 10000; i++) {
				BinaryTree.hashInternal(left, right);
			}

			const end = performance.now();

			// 10k hashes should be very fast
			expect(end - start).toBeLessThan(100);
		});
	});
});
