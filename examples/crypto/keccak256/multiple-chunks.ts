import { Keccak256 } from "../../../src/crypto/Keccak256/index.js";
import { Hex } from "../../../src/primitives/Hex/index.js";

const chunk1 = new Uint8Array([1, 2, 3]);
const chunk2 = new Uint8Array([4, 5, 6]);
const chunk3 = new Uint8Array([7, 8, 9]);

// Hash chunks separately
const multiHash = Keccak256.hashMultiple([chunk1, chunk2, chunk3]);

// Compare to concatenating first
const concatenated = new Uint8Array([...chunk1, ...chunk2, ...chunk3]);
const singleHash = Keccak256.hash(concatenated);

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

// Simulate Merkle tree leaf hashes
const leaf1 = Keccak256.hashString("Transaction 1");
const leaf2 = Keccak256.hashString("Transaction 2");
const leaf3 = Keccak256.hashString("Transaction 3");
const leaf4 = Keccak256.hashString("Transaction 4");

// Build tree level 1
const node1 = Keccak256.hashMultiple([leaf1, leaf2]);
const node2 = Keccak256.hashMultiple([leaf3, leaf4]);

// Build root
const root = Keccak256.hashMultiple([node1, node2]);

// Simulate receiving data in chunks
const dataChunks = [
	new TextEncoder().encode("This is chunk 1. "),
	new TextEncoder().encode("This is chunk 2. "),
	new TextEncoder().encode("This is chunk 3. "),
	new TextEncoder().encode("End of data."),
];

const streamHash = Keccak256.hashMultiple(dataChunks);
for (let i = 0; i < dataChunks.length; i++) {}

const prefix = new TextEncoder().encode("\x19Ethereum Signed Message:\n");
const message = new TextEncoder().encode("Hello, Ethereum!");
const messageLength = new TextEncoder().encode(message.length.toString());

const eip191Hash = Keccak256.hashMultiple([prefix, messageLength, message]);

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
