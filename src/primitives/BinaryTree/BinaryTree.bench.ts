import { bench, run } from "mitata";
import * as BinaryTree from "./BrandedBinaryTree/index.js";

bench("BinaryTree.init", () => {
	BinaryTree.init();
});

await run();

const tree = BinaryTree.init();
const key = new Uint8Array(32);
key[31] = 5;
const value = new Uint8Array(32);
value[31] = 0x42;

bench("BinaryTree.insert - single value", () => {
	BinaryTree.insert(tree, key, value);
});

await run();

let treeWithItems = BinaryTree.init();
const storedKey = new Uint8Array(32);
storedKey[31] = 10;
const storedValue = new Uint8Array(32);
storedValue[31] = 0x99;
treeWithItems = BinaryTree.insert(treeWithItems, storedKey, storedValue);

const nonExistentKey = new Uint8Array(32);
nonExistentKey[31] = 20;

bench("BinaryTree.get - existing key", () => {
	BinaryTree.get(treeWithItems, storedKey);
});

bench("BinaryTree.get - non-existent key", () => {
	BinaryTree.get(treeWithItems, nonExistentKey);
});

await run();

const emptyTree = BinaryTree.init();
let tree4Items = BinaryTree.init();
for (let i = 0; i < 4; i++) {
	const k = new Uint8Array(32);
	k[31] = i;
	const v = new Uint8Array(32);
	v[31] = i * 2;
	tree4Items = BinaryTree.insert(tree4Items, k, v);
}

let tree16Items = BinaryTree.init();
for (let i = 0; i < 16; i++) {
	const k = new Uint8Array(32);
	k[31] = i;
	const v = new Uint8Array(32);
	v[31] = i * 2;
	tree16Items = BinaryTree.insert(tree16Items, k, v);
}

let tree256Items = BinaryTree.init();
for (let i = 0; i < 256; i++) {
	const k = new Uint8Array(32);
	k[30] = Math.floor(i / 256);
	k[31] = i % 256;
	const v = new Uint8Array(32);
	v[31] = i % 256;
	tree256Items = BinaryTree.insert(tree256Items, k, v);
}

bench("BinaryTree.rootHash - empty tree", () => {
	BinaryTree.rootHash(emptyTree);
});

bench("BinaryTree.rootHash - 4 items", () => {
	BinaryTree.rootHash(tree4Items);
});

bench("BinaryTree.rootHash - 16 items", () => {
	BinaryTree.rootHash(tree16Items);
});

bench("BinaryTree.rootHash - 256 items", () => {
	BinaryTree.rootHash(tree256Items);
});

await run();

bench("BinaryTree.rootHashHex - empty tree", () => {
	BinaryTree.rootHashHex(emptyTree);
});

bench("BinaryTree.rootHashHex - 4 items", () => {
	BinaryTree.rootHashHex(tree4Items);
});

bench("BinaryTree.rootHashHex - 16 items", () => {
	BinaryTree.rootHashHex(tree16Items);
});

bench("BinaryTree.rootHashHex - 256 items", () => {
	BinaryTree.rootHashHex(tree256Items);
});

await run();

const address = new Uint8Array(20);
for (let i = 0; i < 20; i++) {
	address[i] = i;
}

bench("BinaryTree.addressToKey", () => {
	BinaryTree.addressToKey(address);
});

await run();

const fullKey = new Uint8Array(32);
fullKey.fill(0xaa);
fullKey[31] = 0x42;

bench("BinaryTree.splitKey", () => {
	BinaryTree.splitKey(fullKey);
});

await run();

const stem = new Uint8Array(31);
stem[0] = 0b10101010;

bench("BinaryTree.getStemBit - position 0", () => {
	BinaryTree.getStemBit(stem, 0);
});

bench("BinaryTree.getStemBit - position 128", () => {
	BinaryTree.getStemBit(stem, 128);
});

await run();

const left = new Uint8Array(32);
left[0] = 0x01;
const right = new Uint8Array(32);
right[0] = 0x02;

bench("BinaryTree.hashInternal", () => {
	BinaryTree.hashInternal(left, right);
});

const stemForHash = new Uint8Array(31);
stemForHash.fill(0xaa);
const stemNode = {
	type: "stem" as const,
	stem: stemForHash,
	values: new Array(256).fill(null),
};

bench("BinaryTree.hashStem", () => {
	BinaryTree.hashStem(stemNode);
});

const leafValue = new Uint8Array(32);
leafValue[31] = 0x42;
const leafNode = { type: "leaf" as const, value: leafValue };

bench("BinaryTree.hashLeaf", () => {
	BinaryTree.hashLeaf(leafNode);
});

await run();

bench("BinaryTree - build with 100 leaves", () => {
	let t = BinaryTree.init();
	for (let i = 0; i < 100; i++) {
		const k = new Uint8Array(32);
		k[30] = Math.floor(i / 256);
		k[31] = i % 256;
		const v = new Uint8Array(32);
		v[31] = i % 256;
		t = BinaryTree.insert(t, k, v);
	}
	BinaryTree.rootHash(t);
});

await run();

bench("BinaryTree - build with 1000 leaves", () => {
	let t = BinaryTree.init();
	for (let i = 0; i < 1000; i++) {
		const k = new Uint8Array(32);
		k[29] = Math.floor(i / 65536);
		k[30] = Math.floor(i / 256) % 256;
		k[31] = i % 256;
		const v = new Uint8Array(32);
		v[30] = Math.floor(i / 256) % 256;
		v[31] = i % 256;
		t = BinaryTree.insert(t, k, v);
	}
	BinaryTree.rootHash(t);
});

await run();

bench("BinaryTree - sequential keys (last byte)", () => {
	let t = BinaryTree.init();
	for (let i = 0; i < 16; i++) {
		const k = new Uint8Array(32);
		k[31] = i;
		const v = new Uint8Array(32);
		v[31] = i;
		t = BinaryTree.insert(t, k, v);
	}
});

bench("BinaryTree - sequential keys (first byte)", () => {
	let t = BinaryTree.init();
	for (let i = 0; i < 16; i++) {
		const k = new Uint8Array(32);
		k[0] = i;
		const v = new Uint8Array(32);
		v[31] = i;
		t = BinaryTree.insert(t, k, v);
	}
});

await run();

bench("BinaryTree - insert via address key", () => {
	let t = BinaryTree.init();
	const addr = new Uint8Array(20);
	addr[19] = 0x42;
	const k = BinaryTree.addressToKey(addr);
	const v = new Uint8Array(32);
	v[31] = 0x99;
	t = BinaryTree.insert(t, k, v);
});

await run();
