/**
 * Key Utilities Example - BinaryTree
 *
 * Demonstrates:
 * - Converting addresses to keys
 * - Splitting keys into stem and subindex
 * - Extracting stem bits for tree traversal
 * - Understanding key structure
 */

import { BinaryTree } from "../../../src/primitives/BinaryTree/index.js";

const address = new Uint8Array(20);
address[0] = 0xf3;
address[1] = 0x9f;
address[2] = 0xd6;
address[19] = 0x66;

const key = BinaryTree.addressToKey(address);

const testKey = new Uint8Array(32);
for (let i = 0; i < 31; i++) {
	testKey[i] = 0xaa;
}
testKey[31] = 0x42; // Subindex

const { stem, idx } = BinaryTree.splitKey(testKey);

const stemExample = new Uint8Array(31);
stemExample[0] = 0b10101010; // Binary: 1-0-1-0-1-0-1-0

for (let pos = 0; pos < 8; pos++) {
	const bit = BinaryTree.getStemBit(stemExample, pos);
	const direction = bit === 0 ? "left" : "right";
}

const pathStem = new Uint8Array(31);
pathStem[0] = 0b11000000; // First two bits: 1, 1

const path = [];
for (let depth = 0; depth < 5; depth++) {
	const bit = BinaryTree.getStemBit(pathStem, depth);
	path.push(bit === 0 ? "L" : "R");
}

const addr1 = new Uint8Array(20);
addr1[0] = 0x00; // First bit of stem will be 0

const addr2 = new Uint8Array(20);
addr2[0] = 0x80; // First bit of stem will be 1

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

const exampleKey = new Uint8Array(32);
exampleKey[12] = 0xab; // Address start
exampleKey[13] = 0xcd;
exampleKey[31] = 5; // Subindex

const { stem: exStem, idx: exIdx } = BinaryTree.splitKey(exampleKey);

const navStem = new Uint8Array(31);
navStem[0] = 0b10110100;

let indent = "          ";
for (let depth = 0; depth < 4; depth++) {
	const bit = BinaryTree.getStemBit(navStem, depth);
	const direction = bit === 0 ? "left" : "right";
	const arrow = bit === 0 ? "/" : "\\";
	indent = `${indent}  `;
}
