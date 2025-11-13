/**
 * Merkle Tree Example - BinaryTree
 *
 * Demonstrates:
 * - Building a Merkle tree with multiple accounts
 * - Computing root hash as state commitment
 * - How tree structure changes with insertions
 * - State verification with root hashes
 */

import { BinaryTree } from "../../../src/primitives/BinaryTree/index.js";
import { Bytes32 } from "../../../src/primitives/Bytes32/index.js";

// Helper to create test data
function createTestData(accountNumber: number): Uint8Array {
	return Bytes32.from(
		`0x${accountNumber.toString(16).padStart(2, "0")}01${"00".repeat(30)}`,
	);
}

let tree = BinaryTree();
const initialHash = BinaryTree.rootHashHex(tree);
const aliceKey = Bytes32.from(
	"0x000000000000000000000001000000000000000000000000000000000000000",
);

const aliceData = createTestData(1);
tree = BinaryTree.insert(tree, aliceKey, aliceData);

const stateRoot1 = BinaryTree.rootHashHex(tree);
const aliceStorageKey = Bytes32.from(
	"0x000000000000000000000001000000000000000000000000000000000000001",
);

const storageValue = Bytes32.from(
	"0x00000000000000000000000000000000000000000000000000000000000000aa",
);

tree = BinaryTree.insert(tree, aliceStorageKey, storageValue);

const stateRoot2 = BinaryTree.rootHashHex(tree);
const bobKey = Bytes32.from(
	"0x000000000000000000000002000000000000000000000000000000000000000",
);

const bobData = createTestData(2);
tree = BinaryTree.insert(tree, bobKey, bobData);

const stateRoot3 = BinaryTree.rootHashHex(tree);
const carolKey = Bytes32.from(
	"0x0000000000000000000000ff000000000000000000000000000000000000000",
);

const carolData = createTestData(3);
tree = BinaryTree.insert(tree, carolKey, carolData);

const stateRoot4 = BinaryTree.rootHashHex(tree);
const aliceRetrieved = BinaryTree.get(tree, aliceKey);
const aliceStorageRetrieved = BinaryTree.get(tree, aliceStorageKey);
const bobRetrieved = BinaryTree.get(tree, bobKey);
const carolRetrieved = BinaryTree.get(tree, carolKey);
const currentRoot = BinaryTree.rootHashHex(tree);
let tree2 = BinaryTree();
tree2 = BinaryTree.insert(tree2, aliceKey, aliceData);
tree2 = BinaryTree.insert(tree2, aliceStorageKey, storageValue);
tree2 = BinaryTree.insert(tree2, bobKey, bobData);
tree2 = BinaryTree.insert(tree2, carolKey, carolData);

const rebuiltRoot = BinaryTree.rootHashHex(tree2);
