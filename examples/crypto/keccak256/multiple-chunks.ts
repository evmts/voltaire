import { Keccak256 } from "../../../src/crypto/Keccak256/index.js";
import { Hex } from "../../../src/primitives/Hex/index.js";

/**
 * Multiple Chunk Hashing
 *
 * Demonstrates efficient hashing of pre-chunked data:
 * - Hash multiple chunks in sequence
 * - Equivalent to concatenating then hashing
 * - Use cases: streaming data, ABI encoding, Merkle trees
 */

console.log("=== Multiple Chunk Hashing ===\n");

// 1. Basic Multiple Chunk Hashing
console.log("1. Basic Multiple Chunk Hashing");
console.log("-".repeat(40));

const chunk1 = new Uint8Array([1, 2, 3]);
const chunk2 = new Uint8Array([4, 5, 6]);
const chunk3 = new Uint8Array([7, 8, 9]);

// Hash chunks separately
const multiHash = Keccak256.hashMultiple([chunk1, chunk2, chunk3]);

// Compare to concatenating first
const concatenated = new Uint8Array([...chunk1, ...chunk2, ...chunk3]);
const singleHash = Keccak256.hash(concatenated);

console.log("Chunk 1:", Array.from(chunk1));
console.log("Chunk 2:", Array.from(chunk2));
console.log("Chunk 3:", Array.from(chunk3));
console.log("\nHash from chunks:       ", Hex.fromBytes(multiHash));
console.log("Hash from concatenated: ", Hex.fromBytes(singleHash));
console.log(
	"Equal:",
	Hex.fromBytes(multiHash) === Hex.fromBytes(singleHash),
	"\n",
);

// 2. ABI Encoding Pattern
console.log("2. ABI Encoding Pattern");
console.log("-".repeat(40));
console.log("Hashing ABI-encoded function parameters\n");

// Simulate ABI encoding: function selector + parameters
const selector = new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]); // transfer(address,uint256)

// Parameter 1: address (padded to 32 bytes)
const addressParam = new Uint8Array(32);
addressParam.set(Hex.toBytes("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"), 12);

// Parameter 2: uint256 amount
const amountParam = new Uint8Array(32);
amountParam.set([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01], 24); // 1 ether in wei

// Hash the complete calldata
const calldataHash = Keccak256.hashMultiple([
	selector,
	addressParam,
	amountParam,
]);

console.log("Function selector:", Hex.fromBytes(selector));
console.log("Address param:   ", Hex.fromBytes(addressParam));
console.log("Amount param:    ", Hex.fromBytes(amountParam));
console.log("\nCalldata hash:", Hex.fromBytes(calldataHash), "\n");

// 3. Merkle Tree Node Hashing
console.log("3. Merkle Tree Node Hashing");
console.log("-".repeat(40));
console.log("Pattern: hash(leftHash ++ rightHash)\n");

// Simulate Merkle tree leaf hashes
const leaf1 = Keccak256.hashString("Transaction 1");
const leaf2 = Keccak256.hashString("Transaction 2");
const leaf3 = Keccak256.hashString("Transaction 3");
const leaf4 = Keccak256.hashString("Transaction 4");

console.log("Leaf hashes:");
console.log("  Leaf 1:", Hex.fromBytes(leaf1).slice(0, 20) + "...");
console.log("  Leaf 2:", Hex.fromBytes(leaf2).slice(0, 20) + "...");
console.log("  Leaf 3:", Hex.fromBytes(leaf3).slice(0, 20) + "...");
console.log("  Leaf 4:", Hex.fromBytes(leaf4).slice(0, 20) + "...");

// Build tree level 1
const node1 = Keccak256.hashMultiple([leaf1, leaf2]);
const node2 = Keccak256.hashMultiple([leaf3, leaf4]);

console.log("\nLevel 1 nodes:");
console.log("  Node 1:", Hex.fromBytes(node1).slice(0, 20) + "...");
console.log("  Node 2:", Hex.fromBytes(node2).slice(0, 20) + "...");

// Build root
const root = Keccak256.hashMultiple([node1, node2]);

console.log("\nMerkle root:", Hex.fromBytes(root), "\n");

// 4. Streaming Data Pattern
console.log("4. Streaming Data Pattern");
console.log("-".repeat(40));
console.log("Hash large data in chunks without loading all at once\n");

// Simulate receiving data in chunks
const dataChunks = [
	new TextEncoder().encode("This is chunk 1. "),
	new TextEncoder().encode("This is chunk 2. "),
	new TextEncoder().encode("This is chunk 3. "),
	new TextEncoder().encode("End of data."),
];

const streamHash = Keccak256.hashMultiple(dataChunks);

console.log("Chunks received:");
for (let i = 0; i < dataChunks.length; i++) {
	console.log(`  Chunk ${i + 1}: "${new TextDecoder().decode(dataChunks[i])}"`);
}
console.log("\nStream hash:", Hex.fromBytes(streamHash), "\n");

// 5. Message Signing with Prefix
console.log("5. Message Signing with Prefix (EIP-191)");
console.log("-".repeat(40));
console.log("Pattern: keccak256(prefix ++ message)\n");

const prefix = new TextEncoder().encode("\x19Ethereum Signed Message:\n");
const message = new TextEncoder().encode("Hello, Ethereum!");
const messageLength = new TextEncoder().encode(message.length.toString());

const eip191Hash = Keccak256.hashMultiple([prefix, messageLength, message]);

console.log('Prefix:  "\\x19Ethereum Signed Message:\\n"');
console.log("Length: ", message.length);
console.log('Message: "Hello, Ethereum!"');
console.log("\nEIP-191 hash:", Hex.fromBytes(eip191Hash), "\n");

// 6. Dynamic Array Encoding
console.log("6. Dynamic Array Encoding");
console.log("-".repeat(40));
console.log("ABI encoding: length ++ elements\n");

// Encode array: [1, 2, 3, 4, 5]
const arrayLength = new Uint8Array(32);
arrayLength[31] = 5; // Length = 5

const element1 = new Uint8Array(32);
element1[31] = 1;
const element2 = new Uint8Array(32);
element2[31] = 2;
const element3 = new Uint8Array(32);
element3[31] = 3;
const element4 = new Uint8Array(32);
element4[31] = 4;
const element5 = new Uint8Array(32);
element5[31] = 5;

const arrayHash = Keccak256.hashMultiple([
	arrayLength,
	element1,
	element2,
	element3,
	element4,
	element5,
]);

console.log("Array: [1, 2, 3, 4, 5]");
console.log("Length:", Hex.fromBytes(arrayLength));
console.log("Elements: 5 x 32 bytes (ABI-encoded uint256)");
console.log("\nArray encoding hash:", Hex.fromBytes(arrayHash), "\n");

// 7. Performance Comparison
console.log("7. Performance Comparison");
console.log("-".repeat(40));

// Create many small chunks
const numChunks = 100;
const smallChunks: Uint8Array[] = [];
let totalSize = 0;

for (let i = 0; i < numChunks; i++) {
	const chunk = new Uint8Array(16);
	crypto.getRandomValues(chunk);
	smallChunks.push(chunk);
	totalSize += chunk.length;
}

// Method 1: hashMultiple
const start1 = performance.now();
const hash1 = Keccak256.hashMultiple(smallChunks);
const time1 = performance.now() - start1;

// Method 2: Concatenate then hash
const start2 = performance.now();
const combined = new Uint8Array(totalSize);
let offset = 0;
for (const chunk of smallChunks) {
	combined.set(chunk, offset);
	offset += chunk.length;
}
const hash2 = Keccak256.hash(combined);
const time2 = performance.now() - start2;

console.log(`Chunks: ${numChunks} x 16 bytes = ${totalSize} bytes total`);
console.log(`\nhashMultiple:     ${time1.toFixed(3)}ms`);
console.log(`Concatenate+hash: ${time2.toFixed(3)}ms`);
console.log(
	`Hashes equal:     ${Hex.fromBytes(hash1) === Hex.fromBytes(hash2)}`,
);
console.log("\nNote: Performance varies by implementation and data size\n");

console.log("=== Complete ===");
