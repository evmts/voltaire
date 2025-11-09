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

console.log("\n=== BinaryTree Hashing and State Commitment ===\n");

// Example 1: Empty tree hash
console.log("1. Empty Tree Hash");
console.log("   ---------------");

const emptyTree = BinaryTree();
const emptyHash = BinaryTree.rootHash(emptyTree);
const emptyHashHex = BinaryTree.rootHashHex(emptyTree);

console.log("   Root type:", emptyTree.root.type);
console.log("   Root hash (bytes):", emptyHash);
console.log("   Root hash (hex):", emptyHashHex);
console.log(
	"   All zeros:",
	emptyHash.every((b) => b === 0),
);
console.log("   Hex representation:", emptyHashHex === "0x" + "0".repeat(64));
console.log("");

// Example 2: Hash after single insertion
console.log("2. Hash After Single Insertion");
console.log("   ----------------------------");

const key1 = new Uint8Array(32);
key1[31] = 0;

const value1 = new Uint8Array(32);
value1[0] = 0x42;

const tree1 = BinaryTree.insert(emptyTree, key1, value1);
const hash1 = BinaryTree.rootHash(tree1);
const hashHex1 = BinaryTree.rootHashHex(tree1);

console.log("   Root type:", tree1.root.type);
console.log(
	"   Root hash changed:",
	!hash1.every((b, i) => b === emptyHash[i]),
);
console.log("   Root hash (hex):", hashHex1);
console.log("   Hash is non-zero:", !hash1.every((b) => b === 0));
console.log("");

// Example 3: Hash changes with each modification
console.log("3. Hash Changes with Each Modification");
console.log("   ------------------------------------");

let currentTree = tree1;
const hashes = [hashHex1];

console.log("   Initial hash:", hashHex1);

for (let i = 1; i < 4; i++) {
	const key = new Uint8Array(32);
	key[31] = i;

	const value = new Uint8Array(32);
	value[0] = 0x10 + i;

	currentTree = BinaryTree.insert(currentTree, key, value);
	const newHash = BinaryTree.rootHashHex(currentTree);
	hashes.push(newHash);

	console.log(`   After insert ${i}: ${newHash}`);
}

console.log("   All hashes unique:", new Set(hashes).size === hashes.length);
console.log("");

// Example 4: Deterministic hashing
console.log("4. Deterministic Hashing");
console.log("   ---------------------");

let tree2a = BinaryTree();
let tree2b = BinaryTree();

const insertData = [
	{ key: [0], value: 0x01 },
	{ key: [1], value: 0x02 },
	{ key: [2], value: 0x03 },
];

for (const { key: keyBytes, value: valueByte } of insertData) {
	const key = new Uint8Array(32);
	key[31] = keyBytes[0];

	const value = new Uint8Array(32);
	value[0] = valueByte;

	tree2a = BinaryTree.insert(tree2a, key, value);
	tree2b = BinaryTree.insert(tree2b, key, value);
}

const hash2a = BinaryTree.rootHashHex(tree2a);
const hash2b = BinaryTree.rootHashHex(tree2b);

console.log("   Tree A hash:", hash2a);
console.log("   Tree B hash:", hash2b);
console.log("   Hashes match:", hash2a === hash2b);
console.log("   Same operations always produce same hash");
console.log("");

// Example 5: Different insertion order (if supported)
console.log("5. Hash Comparison with Different Values");
console.log("   --------------------------------------");

let tree3a = BinaryTree();
let tree3b = BinaryTree();

// Tree A: value 0xFF at subindex 0
const keyA = new Uint8Array(32);
keyA[31] = 0;
const valueA = new Uint8Array(32);
valueA[0] = 0xff;

tree3a = BinaryTree.insert(tree3a, keyA, valueA);

// Tree B: value 0xFE at subindex 0
const keyB = new Uint8Array(32);
keyB[31] = 0;
const valueB = new Uint8Array(32);
valueB[0] = 0xfe;

tree3b = BinaryTree.insert(tree3b, keyB, valueB);

const hash3a = BinaryTree.rootHashHex(tree3a);
const hash3b = BinaryTree.rootHashHex(tree3b);

console.log("   Tree A (value 0xFF):", hash3a);
console.log("   Tree B (value 0xFE):", hash3b);
console.log("   Hashes differ:", hash3a !== hash3b);
console.log("   Even 1-byte change produces different hash");
console.log("");

// Example 6: Internal node hashing
console.log("6. Internal Node Hashing (Different Stems)");
console.log("   ----------------------------------------");

let tree4 = BinaryTree();

// Insert with stem starting with 0x00
const key4a = new Uint8Array(32);
key4a[0] = 0x00;
key4a[31] = 0;

const value4a = new Uint8Array(32);
value4a[0] = 0xaa;

tree4 = BinaryTree.insert(tree4, key4a, value4a);
const hashAfterFirst = BinaryTree.rootHashHex(tree4);
console.log("   After first stem:", hashAfterFirst);
console.log("   Root type:", tree4.root.type);

// Insert with stem starting with 0xFF (will create internal node)
const key4b = new Uint8Array(32);
key4b[0] = 0xff;
key4b[31] = 0;

const value4b = new Uint8Array(32);
value4b[0] = 0xbb;

tree4 = BinaryTree.insert(tree4, key4b, value4b);
const hashAfterSecond = BinaryTree.rootHashHex(tree4);
console.log("   After second stem:", hashAfterSecond);
console.log("   Root type:", tree4.root.type);
console.log("   Root changed to internal:", tree4.root.type === "internal");
console.log("   Hash changed:", hashAfterFirst !== hashAfterSecond);
console.log("");

// Example 7: Hex vs binary hash
console.log("7. Hash Representations");
console.log("   --------------------");

const tree5 = BinaryTree.insert(emptyTree, key1, value1);
const binaryHash = BinaryTree.rootHash(tree5);
const hexHash = BinaryTree.rootHashHex(tree5);

console.log("   Binary hash (Uint8Array):");
console.log("     Length:", binaryHash.length, "bytes");
console.log(
	"     First 4 bytes:",
	Array.from(binaryHash.slice(0, 4))
		.map((b) => "0x" + b.toString(16).padStart(2, "0"))
		.join(" "),
);

console.log("   Hex hash (string):");
console.log("     Length:", hexHash.length, "characters");
console.log("     Format:", hexHash.startsWith("0x") ? "0x-prefixed" : "plain");
console.log("     Value:", hexHash);
console.log("");

// Example 8: State commitment verification
console.log("8. State Commitment Verification");
console.log("   ------------------------------");

let tree6 = BinaryTree();

// Build initial state
for (let i = 0; i < 3; i++) {
	const key = new Uint8Array(32);
	key[31] = i;
	const value = new Uint8Array(32);
	value[0] = 0x10 + i;
	tree6 = BinaryTree.insert(tree6, key, value);
}

const committedHash = BinaryTree.rootHashHex(tree6);
console.log("   State committed with hash:", committedHash);

// Rebuild same state
let tree6verify = BinaryTree();
for (let i = 0; i < 3; i++) {
	const key = new Uint8Array(32);
	key[31] = i;
	const value = new Uint8Array(32);
	value[0] = 0x10 + i;
	tree6verify = BinaryTree.insert(tree6verify, key, value);
}

const verifyHash = BinaryTree.rootHashHex(tree6verify);
console.log("   Rebuilt state hash:        ", verifyHash);
console.log("   Hashes match:", committedHash === verifyHash);
console.log("   State verified successfully:", committedHash === verifyHash);
console.log("");

// Example 9: Hash collision resistance
console.log("9. Hash Collision Resistance");
console.log("   -------------------------");

const collisionHashes = new Set<string>();

for (let i = 0; i < 10; i++) {
	let tree = BinaryTree();
	const key = new Uint8Array(32);
	key[31] = i;
	const value = new Uint8Array(32);
	value[0] = i;
	tree = BinaryTree.insert(tree, key, value);
	collisionHashes.add(BinaryTree.rootHashHex(tree));
}

console.log(
	"   Generated",
	collisionHashes.size,
	"hashes from 10 different trees",
);
console.log("   All unique:", collisionHashes.size === 10);
console.log("   No collisions detected");
console.log("");

console.log("=== Example Complete ===\n");
