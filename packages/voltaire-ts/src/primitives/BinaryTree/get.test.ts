/**
 * Issue #58: BinaryTree.get() returned null for data below internal nodes.
 */

import { describe, expect, test } from "vitest";
import type { Node } from "./BinaryTreeType.js";
import * as BinaryTree from "./index.js";

/** Key whose stem starts with `first` and whose subindex is `idx`. */
function key(first: number, idx = 0, last = 0): Uint8Array {
	const k = new Uint8Array(32);
	k[0] = first;
	k[30] = last;
	k[31] = idx;
	return k;
}

function value(n: number): Uint8Array {
	const v = new Uint8Array(32);
	v[31] = n;
	return v;
}

function insertAll(entries: [Uint8Array, Uint8Array][]) {
	let tree = BinaryTree.init();
	for (const [k, v] of entries) tree = BinaryTree.insert(tree, k, v);
	return tree;
}

describe("BinaryTree.get", () => {
	test("root: empty tree returns null", () => {
		expect(BinaryTree.get(BinaryTree.init(), key(0))).toBeNull();
	});

	test("root stem: returns stored value, null for other subindex/stem", () => {
		const tree = insertAll([[key(0x10, 3), value(1)]]);
		expect(tree.root.type).toBe("stem");
		expect(BinaryTree.get(tree, key(0x10, 3))).toEqual(value(1));
		expect(BinaryTree.get(tree, key(0x10, 4))).toBeNull();
		expect(BinaryTree.get(tree, key(0x11, 3))).toBeNull();
	});

	test("internal root: stems diverging at bit 0 are both retrievable", () => {
		const tree = insertAll([
			[key(0x00, 1), value(1)],
			[key(0x80, 2), value(2)],
		]);
		expect(tree.root.type).toBe("internal");
		expect(BinaryTree.get(tree, key(0x00, 1))).toEqual(value(1));
		expect(BinaryTree.get(tree, key(0x80, 2))).toEqual(value(2));
		expect(BinaryTree.get(tree, key(0x00, 2))).toBeNull();
		expect(BinaryTree.get(tree, key(0x40, 1))).toBeNull();
	});

	test("deep internal chain: stems diverging at the last stem bit", () => {
		const tree = insertAll([
			[key(0x00, 9, 0x00), value(1)],
			[key(0x00, 9, 0x01), value(2)],
		]);
		expect(tree.root.type).toBe("internal");
		expect(BinaryTree.get(tree, key(0x00, 9, 0x00))).toEqual(value(1));
		expect(BinaryTree.get(tree, key(0x00, 9, 0x01))).toEqual(value(2));
		expect(BinaryTree.get(tree, key(0x00, 9, 0x02))).toBeNull();
	});

	test("insert below an existing internal root keeps all values", () => {
		const entries: [Uint8Array, Uint8Array][] = [
			[key(0x00, 0), value(1)],
			[key(0x80, 0), value(2)],
			[key(0x40, 0), value(3)],
			[key(0xc0, 7), value(4)],
			[key(0x41, 0), value(5)],
			[key(0x00, 200), value(6)],
		];
		const tree = insertAll(entries);
		for (const [k, v] of entries) {
			expect(BinaryTree.get(tree, k)).toEqual(v);
		}
	});

	test("overwrite below an internal node", () => {
		let tree = insertAll([
			[key(0x00), value(1)],
			[key(0x80), value(2)],
		]);
		tree = BinaryTree.insert(tree, key(0x80), value(9));
		expect(BinaryTree.get(tree, key(0x80))).toEqual(value(9));
		expect(BinaryTree.get(tree, key(0x00))).toEqual(value(1));
	});

	test("many random keys round-trip", () => {
		let seed = 1;
		const rand = () => {
			seed = (seed * 1103515245 + 12345) & 0x7fffffff;
			return seed & 0xff;
		};
		const entries: [Uint8Array, Uint8Array][] = [];
		for (let i = 0; i < 64; i++) {
			const k = new Uint8Array(32);
			for (let j = 0; j < 32; j++) k[j] = rand();
			entries.push([k, value(i)]);
		}
		const tree = insertAll(entries);
		for (const [k, v] of entries) {
			expect(BinaryTree.get(tree, k)).toEqual(v);
		}
	});

	test("root hash is insertion-order independent", () => {
		const entries: [Uint8Array, Uint8Array][] = [
			[key(0x00, 1), value(1)],
			[key(0x80, 2), value(2)],
			[key(0x40, 3), value(3)],
		];
		const a = insertAll(entries);
		const b = insertAll([...entries].reverse());
		expect(BinaryTree.rootHash(a)).toEqual(BinaryTree.rootHash(b));
	});

	test("internal node hashes match their children", () => {
		const tree = insertAll([
			[key(0x00), value(1)],
			[key(0x80), value(2)],
			[key(0x40), value(3)],
		]);
		const check = (node: Node) => {
			if (node.type !== "internal") return;
			expect(node.left).toEqual(
				BinaryTree.hashNode(node.leftChild ?? { type: "empty" }),
			);
			expect(node.right).toEqual(
				BinaryTree.hashNode(node.rightChild ?? { type: "empty" }),
			);
			if (node.leftChild) check(node.leftChild);
			if (node.rightChild) check(node.rightChild);
		};
		check(tree.root);
	});

	test("leaf root returns null", () => {
		const tree = { root: { type: "leaf", value: value(1) } as const };
		expect(BinaryTree.get(tree, key(0))).toBeNull();
	});

	test("hash-only internal node: zero-hash side is empty", () => {
		const tree = {
			root: {
				type: "internal",
				left: new Uint8Array(32),
				right: new Uint8Array(32).fill(1),
			} as const,
		};
		expect(BinaryTree.get(tree, key(0x00))).toBeNull();
	});

	test("hash-only internal node: pruned subtree throws", () => {
		const tree = {
			root: {
				type: "internal",
				left: new Uint8Array(32),
				right: new Uint8Array(32).fill(1),
			} as const,
		};
		expect(() => BinaryTree.get(tree, key(0x80))).toThrow(
			BinaryTree.InvalidTreeStateError,
		);
	});
});
