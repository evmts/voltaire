import { Keccak256 } from "../../../src/crypto/Keccak256/index.js";
import { Hex } from "../../../src/primitives/Hex/index.js";

const chunk1 = Hex("0x010203");
const chunk2 = Hex("0x040506");
const chunk3 = Hex("0x070809");

// Hash chunks separately
const multiHash = Keccak256.hashMultiple([chunk1, chunk2, chunk3]);

// Compare to concatenating first
const concatenated = Hex.concat([chunk1, chunk2, chunk3]);
const singleHash = Keccak256.hashHex(concatenated);

// Simulate ABI encoding: function selector + parameters
const selector = Hex("0xa9059cbb"); // transfer(address,uint256)

// Parameter 1: address (padded to 32 bytes)
const addressParam = Hex(
	"0x000000000000000000000000742d35Cc6634C0532925a3b844Bc9e7595f51e3e",
);

// Parameter 2: uint256 amount
const amountParam = Hex(
	"0x0000000000000000000000000000000000000000000000000de0b6b3a7640000",
); // 1 ether in wei

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
const arrayLength = Hex(
	"0x0000000000000000000000000000000000000000000000000000000000000005",
); // Length = 5

const element1 = Hex(
	"0x0000000000000000000000000000000000000000000000000000000000000001",
);
const element2 = Hex(
	"0x0000000000000000000000000000000000000000000000000000000000000002",
);
const element3 = Hex(
	"0x0000000000000000000000000000000000000000000000000000000000000003",
);
const element4 = Hex(
	"0x0000000000000000000000000000000000000000000000000000000000000004",
);
const element5 = Hex(
	"0x0000000000000000000000000000000000000000000000000000000000000005",
);

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
const smallChunks: string[] = [];

for (let i = 0; i < numChunks; i++) {
	const chunkBytes = new Uint8Array(16);
	crypto.getRandomValues(chunkBytes);
	smallChunks.push(Hex.fromBytes(chunkBytes));
}

// Method 1: hashMultiple
const start1 = performance.now();
const hash1 = Keccak256.hashMultiple(smallChunks as any);
const time1 = performance.now() - start1;

// Method 2: Concatenate then hash
const start2 = performance.now();
const combined = Hex.concat(smallChunks as any);
const hash2 = Keccak256.hashHex(combined);
const time2 = performance.now() - start2;
