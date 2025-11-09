/**
 * Basic Operations Example - BinaryTree
 *
 * Demonstrates:
 * - Creating an empty tree
 * - Inserting values
 * - Retrieving values
 * - Computing root hash
 */

import { BinaryTree } from "../../../src/primitives/BinaryTree/index.js";
const tree = BinaryTree();
const key1 = new Uint8Array(32);
key1[31] = 5; // Subindex 5

const value1 = new Uint8Array(32);
value1[0] = 0x42;

let tree2 = BinaryTree.insert(tree, key1, value1);
const retrieved = BinaryTree.get(tree2, key1);
if (retrieved) {
} else {
}
const key2 = new Uint8Array(32);
key2[31] = 10; // Different subindex

const value2 = new Uint8Array(32);
value2[0] = 0x99;

tree2 = BinaryTree.insert(tree2, key2, value2);
const val1 = BinaryTree.get(tree2, key1);
const val2 = BinaryTree.get(tree2, key2);
const key3 = new Uint8Array(32);
key3[0] = 0xff; // Different stem (first byte differs)
key3[31] = 0;

const value3 = new Uint8Array(32);
value3[0] = 0xab;

const tree3 = BinaryTree.insert(tree2, key3, value3);
const nonExistentKey = new Uint8Array(32);
nonExistentKey[31] = 99;

const notFound = BinaryTree.get(tree3, nonExistentKey);
const updatedValue = new Uint8Array(32);
updatedValue[0] = 0xff;

const tree4 = BinaryTree.insert(tree3, key1, updatedValue);
const updated = BinaryTree.get(tree4, key1);
