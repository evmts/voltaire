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

// Helper to create test data
function createTestData(accountNumber: number): Uint8Array {
	const data = new Uint8Array(32);
	data[0] = accountNumber;
	data[1] = 0x01; // version
	return data;
}
let tree = BinaryTree();
const initialHash = BinaryTree.rootHashHex(tree);
const aliceKey = new Uint8Array(32);
aliceKey[12] = 0x01; // Address-like key
aliceKey[31] = 0; // Subindex 0 (account data)

const aliceData = createTestData(1);
tree = BinaryTree.insert(tree, aliceKey, aliceData);

const stateRoot1 = BinaryTree.rootHashHex(tree);
const aliceStorageKey = new Uint8Array(32);
aliceStorageKey[12] = 0x01; // Same address
aliceStorageKey[31] = 1; // Subindex 1 (storage slot 0)

const storageValue = new Uint8Array(32);
storageValue[31] = 0xaa;

tree = BinaryTree.insert(tree, aliceStorageKey, storageValue);

const stateRoot2 = BinaryTree.rootHashHex(tree);
const bobKey = new Uint8Array(32);
bobKey[12] = 0x02; // Different address
bobKey[31] = 0; // Subindex 0 (account data)

const bobData = createTestData(2);
tree = BinaryTree.insert(tree, bobKey, bobData);

const stateRoot3 = BinaryTree.rootHashHex(tree);
const carolKey = new Uint8Array(32);
carolKey[12] = 0xff; // Very different address
carolKey[31] = 0; // Subindex 0 (account data)

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
