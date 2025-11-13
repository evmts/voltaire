/**
 * Key Utilities Example - BinaryTree
 *
 * Demonstrates:
 * - Converting addresses to keys
 * - Splitting keys into stem and subindex
 * - Extracting stem bits for tree traversal
 * - Understanding key structure
 */

import { Address } from "../../../src/primitives/Address/index.js";
import { BinaryTree } from "../../../src/primitives/BinaryTree/index.js";
import { Bytes32 } from "../../../src/primitives/Bytes32/index.js";

const address = Address.from("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");

const key = BinaryTree.addressToKey(address);

const testKey = Bytes32.from(
	"0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa42",
);

const { stem, idx } = BinaryTree.splitKey(testKey);

const stemExample = Bytes32.from(
	"0xaa00000000000000000000000000000000000000000000000000000000000000",
).slice(0, 31);

for (let pos = 0; pos < 8; pos++) {
	const bit = BinaryTree.getStemBit(stemExample, pos);
	const direction = bit === 0 ? "left" : "right";
}

const pathStem = Bytes32.from(
	"0xc000000000000000000000000000000000000000000000000000000000000000",
).slice(0, 31);

const path = [];
for (let depth = 0; depth < 5; depth++) {
	const bit = BinaryTree.getStemBit(pathStem, depth);
	path.push(bit === 0 ? "L" : "R");
}

const addr1 = Address.from("0x0000000000000000000000000000000000000000");
const addr2 = Address.from("0x8000000000000000000000000000000000000000");

const key1 = BinaryTree.addressToKey(addr1);
const key2 = BinaryTree.addressToKey(addr2);

const { stem: stem1 } = BinaryTree.splitKey(key1);
const { stem: stem2 } = BinaryTree.splitKey(key2);

const bit1_0 = BinaryTree.getStemBit(stem1, 0);
const bit2_0 = BinaryTree.getStemBit(stem2, 0);

const baseKey = BinaryTree.addressToKey(address);

const subindexMap = [
	{ idx: 0, desc: "Account basic data (version, nonce, balance, code size)" },
	{ idx: 1, desc: "Storage slot 0" },
	{ idx: 2, desc: "Storage slot 1" },
	{ idx: 128, desc: "Storage slot 127" },
	{ idx: 255, desc: "Storage slot 254" },
];

for (const { idx, desc } of subindexMap) {
	const keyForIdx = baseKey.slice();
	keyForIdx[31] = idx;
}

const exampleKey = Bytes32.from(
	"0x000000000000000000000000abcd00000000000000000000000000000000005",
);

const { stem: exStem, idx: exIdx } = BinaryTree.splitKey(exampleKey);

const navStem = Bytes32.from(
	"0xb400000000000000000000000000000000000000000000000000000000000000",
).slice(0, 31);

let indent = "          ";
for (let depth = 0; depth < 4; depth++) {
	const bit = BinaryTree.getStemBit(navStem, depth);
	const direction = bit === 0 ? "left" : "right";
	const arrow = bit === 0 ? "/" : "\\";
	indent = `${indent}  `;
}
