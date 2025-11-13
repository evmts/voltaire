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
import { Bytes32 } from "../../../src/primitives/Bytes32/index.js";

const tree = BinaryTree();

// Keys and values are 32-byte arrays
const key1 = Bytes32.from("0x0000000000000000000000000000000000000000000000000000000000000005");
const value1 = Bytes32.from("0x4200000000000000000000000000000000000000000000000000000000000000");

let tree2 = BinaryTree.insert(tree, key1, value1);
const retrieved = BinaryTree.get(tree2, key1);
if (retrieved) {
} else {
}
const key2 = Bytes32.from("0x000000000000000000000000000000000000000000000000000000000000000a");
const value2 = Bytes32.from("0x9900000000000000000000000000000000000000000000000000000000000000");

tree2 = BinaryTree.insert(tree2, key2, value2);
const val1 = BinaryTree.get(tree2, key1);
const val2 = BinaryTree.get(tree2, key2);
const key3 = Bytes32.from("0xff00000000000000000000000000000000000000000000000000000000000000");
const value3 = Bytes32.from("0xab00000000000000000000000000000000000000000000000000000000000000");

const tree3 = BinaryTree.insert(tree2, key3, value3);
const nonExistentKey = Bytes32.from("0x0000000000000000000000000000000000000000000000000000000000000063");

const notFound = BinaryTree.get(tree3, nonExistentKey);
const updatedValue = Bytes32.from("0xff00000000000000000000000000000000000000000000000000000000000000");

const tree4 = BinaryTree.insert(tree3, key1, updatedValue);
const updated = BinaryTree.get(tree4, key1);
