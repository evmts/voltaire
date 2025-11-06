import { bench, run } from "mitata";
import * as BinaryTree from "./BrandedBinaryTree/index.js";

console.log("=".repeat(80));
console.log("BinaryTree Benchmark");
console.log("=".repeat(80));
console.log("");

// =============================================================================
// 1. BinaryTree.init - Create empty tree
// =============================================================================

console.log("1. BinaryTree.init - Create empty tree");
console.log("-".repeat(80));

bench("BinaryTree.init", () => {
	BinaryTree.init();
});

await run();
console.log("");

// =============================================================================
// 2. BinaryTree.insert - Insert single values
// =============================================================================

console.log("2. BinaryTree.insert - Insert single values");
console.log("-".repeat(80));

const tree = BinaryTree.init();
const key = new Uint8Array(32);
key[31] = 5;
const value = new Uint8Array(32);
value[31] = 0x42;

bench("BinaryTree.insert - single value", () => {
	BinaryTree.insert(tree, key, value);
});

await run();
console.log("");

// =============================================================================
// 3. BinaryTree.get - Retrieve values
// =============================================================================

console.log("3. BinaryTree.get - Retrieve values");
console.log("-".repeat(80));

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
console.log("");

// =============================================================================
// 4. BinaryTree.rootHash - Compute root hash
// =============================================================================

console.log("4. BinaryTree.rootHash - Compute root hash");
console.log("-".repeat(80));

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
console.log("");

// =============================================================================
// 5. BinaryTree.rootHashHex - Compute root hash as hex
// =============================================================================

console.log("5. BinaryTree.rootHashHex - Compute root hash as hex");
console.log("-".repeat(80));

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
console.log("");

// =============================================================================
// 6. BinaryTree.addressToKey - Convert address to key
// =============================================================================

console.log("6. BinaryTree.addressToKey - Convert address to key");
console.log("-".repeat(80));

const address = new Uint8Array(20);
for (let i = 0; i < 20; i++) {
	address[i] = i;
}

bench("BinaryTree.addressToKey", () => {
	BinaryTree.addressToKey(address);
});

await run();
console.log("");

// =============================================================================
// 7. BinaryTree.splitKey - Split key into stem and index
// =============================================================================

console.log("7. BinaryTree.splitKey - Split key into stem and index");
console.log("-".repeat(80));

const fullKey = new Uint8Array(32);
fullKey.fill(0xaa);
fullKey[31] = 0x42;

bench("BinaryTree.splitKey", () => {
	BinaryTree.splitKey(fullKey);
});

await run();
console.log("");

// =============================================================================
// 8. BinaryTree.getStemBit - Get bit from stem
// =============================================================================

console.log("8. BinaryTree.getStemBit - Get bit from stem");
console.log("-".repeat(80));

const stem = new Uint8Array(31);
stem[0] = 0b10101010;

bench("BinaryTree.getStemBit - position 0", () => {
	BinaryTree.getStemBit(stem, 0);
});

bench("BinaryTree.getStemBit - position 128", () => {
	BinaryTree.getStemBit(stem, 128);
});

await run();
console.log("");

// =============================================================================
// 9. BinaryTree hashing operations
// =============================================================================

console.log("9. BinaryTree hashing operations");
console.log("-".repeat(80));

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
console.log("");

// =============================================================================
// 10. Batch operations - Build tree with 100 leaves
// =============================================================================

console.log("10. Batch operations - Build tree with 100 leaves");
console.log("-".repeat(80));

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
console.log("");

// =============================================================================
// 11. Batch operations - Build tree with 1000 leaves
// =============================================================================

console.log("11. Batch operations - Build tree with 1000 leaves");
console.log("-".repeat(80));

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
console.log("");

// =============================================================================
// 12. Sequential inserts with different key patterns
// =============================================================================

console.log("12. Sequential inserts with different key patterns");
console.log("-".repeat(80));

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
console.log("");

// =============================================================================
// 13. Address-based tree operations
// =============================================================================

console.log("13. Address-based tree operations");
console.log("-".repeat(80));

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
console.log("");

console.log("=".repeat(80));
console.log("BinaryTree Benchmarks Complete");
console.log("=".repeat(80));
