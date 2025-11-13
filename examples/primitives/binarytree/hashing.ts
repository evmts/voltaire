/**
 * Hashing Example - BinaryTree
 *
 * Demonstrates:
 * - Computing node hashes
 * - Root hash calculation
 * - Hash changes with state modifications
 * - Deterministic hashing
 */

import { BinaryTree } from "../../../src/primitives/BinaryTree/index.js";
import { Bytes32 } from "../../../src/primitives/Bytes32/index.js";

const emptyTree = BinaryTree();
const emptyHash = BinaryTree.rootHash(emptyTree);
const emptyHashHex = BinaryTree.rootHashHex(emptyTree);

const key1 = Bytes32.from("0x0000000000000000000000000000000000000000000000000000000000000000");
const value1 = Bytes32.from("0x4200000000000000000000000000000000000000000000000000000000000000");

const tree1 = BinaryTree.insert(emptyTree, key1, value1);
const hash1 = BinaryTree.rootHash(tree1);
const hashHex1 = BinaryTree.rootHashHex(tree1);

let currentTree = tree1;
const hashes = [hashHex1];

for (let i = 1; i < 4; i++) {
	const key = Bytes32.from(`0x${i.toString(16).padStart(64, "0")}`);
	const value = Bytes32.from(`0x${(0x10 + i).toString(16).padStart(2, "0")}${"00".repeat(31)}`);

	currentTree = BinaryTree.insert(currentTree, key, value);
	const newHash = BinaryTree.rootHashHex(currentTree);
	hashes.push(newHash);
}

let tree2a = BinaryTree();
let tree2b = BinaryTree();

const insertData = [
	{ key: [0], value: 0x01 },
	{ key: [1], value: 0x02 },
	{ key: [2], value: 0x03 },
];

for (const { key: keyBytes, value: valueByte } of insertData) {
	const key = Bytes32.from(`0x${keyBytes[0].toString(16).padStart(64, "0")}`);
	const value = Bytes32.from(`0x${valueByte.toString(16).padStart(2, "0")}${"00".repeat(31)}`);

	tree2a = BinaryTree.insert(tree2a, key, value);
	tree2b = BinaryTree.insert(tree2b, key, value);
}

const hash2a = BinaryTree.rootHashHex(tree2a);
const hash2b = BinaryTree.rootHashHex(tree2b);

let tree3a = BinaryTree();
let tree3b = BinaryTree();

// Tree A: value 0xFF at subindex 0
const keyA = Bytes32.from("0x0000000000000000000000000000000000000000000000000000000000000000");
const valueA = Bytes32.from("0xff00000000000000000000000000000000000000000000000000000000000000");

tree3a = BinaryTree.insert(tree3a, keyA, valueA);

// Tree B: value 0xFE at subindex 0
const keyB = Bytes32.from("0x0000000000000000000000000000000000000000000000000000000000000000");
const valueB = Bytes32.from("0xfe00000000000000000000000000000000000000000000000000000000000000");

tree3b = BinaryTree.insert(tree3b, keyB, valueB);

const hash3a = BinaryTree.rootHashHex(tree3a);
const hash3b = BinaryTree.rootHashHex(tree3b);

let tree4 = BinaryTree();

// Insert with stem starting with 0x00
const key4a = Bytes32.from("0x0000000000000000000000000000000000000000000000000000000000000000");
const value4a = Bytes32.from("0xaa00000000000000000000000000000000000000000000000000000000000000");

tree4 = BinaryTree.insert(tree4, key4a, value4a);
const hashAfterFirst = BinaryTree.rootHashHex(tree4);

// Insert with stem starting with 0xFF (will create internal node)
const key4b = Bytes32.from("0xff00000000000000000000000000000000000000000000000000000000000000");
const value4b = Bytes32.from("0xbb00000000000000000000000000000000000000000000000000000000000000");

tree4 = BinaryTree.insert(tree4, key4b, value4b);
const hashAfterSecond = BinaryTree.rootHashHex(tree4);

const tree5 = BinaryTree.insert(emptyTree, key1, value1);
const binaryHash = BinaryTree.rootHash(tree5);
const hexHash = BinaryTree.rootHashHex(tree5);

let tree6 = BinaryTree();

// Build initial state
for (let i = 0; i < 3; i++) {
	const key = Bytes32.from(`0x${i.toString(16).padStart(64, "0")}`);
	const value = Bytes32.from(`0x${(0x10 + i).toString(16).padStart(2, "0")}${"00".repeat(31)}`);
	tree6 = BinaryTree.insert(tree6, key, value);
}

const committedHash = BinaryTree.rootHashHex(tree6);

// Rebuild same state
let tree6verify = BinaryTree();
for (let i = 0; i < 3; i++) {
	const key = Bytes32.from(`0x${i.toString(16).padStart(64, "0")}`);
	const value = Bytes32.from(`0x${(0x10 + i).toString(16).padStart(2, "0")}${"00".repeat(31)}`);
	tree6verify = BinaryTree.insert(tree6verify, key, value);
}

const verifyHash = BinaryTree.rootHashHex(tree6verify);

const collisionHashes = new Set<string>();

for (let i = 0; i < 10; i++) {
	let tree = BinaryTree();
	const key = Bytes32.from(`0x${i.toString(16).padStart(64, "0")}`);
	const value = Bytes32.from(`0x${i.toString(16).padStart(2, "0")}${"00".repeat(31)}`);
	tree = BinaryTree.insert(tree, key, value);
	collisionHashes.add(BinaryTree.rootHashHex(tree));
}
