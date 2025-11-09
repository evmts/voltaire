/**
 * SHA256 Precompile - Bitcoin Integration
 *
 * Demonstrates:
 * - Double SHA-256 (Bitcoin block hashing)
 * - Bitcoin P2PKH address generation (SHA-256 + RIPEMD-160)
 * - Merkle tree hashing for SPV proofs
 * - Gas cost analysis for cross-chain operations
 */

import {
	execute,
	PrecompileAddress,
} from "../../../src/precompiles/precompiles.js";
import * as Hardfork from "../../../src/primitives/Hardfork/index.js";

console.log("=== SHA256 Bitcoin Integration ===\n");

// Example 1: Bitcoin Double SHA-256 (block hashing)
console.log("=== Example 1: Double SHA-256 (Bitcoin Block Hash) ===");

// Simulate a Bitcoin block header (80 bytes)
const blockHeader = new Uint8Array(80);
// Version (4 bytes)
blockHeader.set([0x01, 0x00, 0x00, 0x00], 0);
// Previous block hash (32 bytes) - simplified
blockHeader.set(new Uint8Array(32).fill(0xaa), 4);
// Merkle root (32 bytes) - simplified
blockHeader.set(new Uint8Array(32).fill(0xbb), 36);
// Timestamp (4 bytes)
blockHeader.set([0x4e, 0x61, 0xbc, 0x00], 68);
// Bits (4 bytes)
blockHeader.set([0xff, 0xff, 0x00, 0x1d], 72);
// Nonce (4 bytes)
blockHeader.set([0x01, 0x23, 0x45, 0x67], 76);

console.log("Block header size:", blockHeader.length, "bytes");

// First SHA-256
const words1 = Math.ceil(blockHeader.length / 32);
const gas1 = 60n + 12n * BigInt(words1);
console.log("First SHA-256 gas:", gas1.toString());

const firstHash = execute(
	PrecompileAddress.SHA256,
	blockHeader,
	gas1,
	Hardfork.CANCUN,
);

if (firstHash.success) {
	console.log(
		"First hash:",
		"0x" + Buffer.from(firstHash.output).toString("hex"),
	);

	// Second SHA-256 (Bitcoin uses double SHA-256)
	const words2 = Math.ceil(firstHash.output.length / 32);
	const gas2 = 60n + 12n * BigInt(words2);
	console.log("Second SHA-256 gas:", gas2.toString());

	const blockHash = execute(
		PrecompileAddress.SHA256,
		firstHash.output,
		gas2,
		Hardfork.CANCUN,
	);

	if (blockHash.success) {
		console.log(
			"Block hash (double SHA-256):",
			"0x" + Buffer.from(blockHash.output).toString("hex"),
		);
		console.log(
			"Total gas:",
			(firstHash.gasUsed + blockHash.gasUsed).toString(),
		);
	}
}

// Example 2: Bitcoin P2PKH Address Generation (Part 1: SHA-256)
console.log("\n=== Example 2: Bitcoin Address Generation (SHA-256 step) ===");

// Simulate a Bitcoin public key (33 bytes compressed format)
const publicKey = new Uint8Array(33);
publicKey[0] = 0x02; // Compressed public key prefix
crypto.getRandomValues(publicKey.subarray(1));

console.log(
	"Public key (compressed):",
	"0x" + Buffer.from(publicKey).toString("hex"),
);

// Step 1: SHA-256 of public key
const pkWords = Math.ceil(publicKey.length / 32);
const pkGas = 60n + 12n * BigInt(pkWords);

const sha256Hash = execute(
	PrecompileAddress.SHA256,
	publicKey,
	pkGas,
	Hardfork.CANCUN,
);

if (sha256Hash.success) {
	console.log(
		"SHA-256(pubkey):",
		"0x" + Buffer.from(sha256Hash.output).toString("hex"),
	);
	console.log(
		"Next step: RIPEMD-160(SHA-256(pubkey)) - see RIPEMD160 examples",
	);
	console.log("Gas used:", sha256Hash.gasUsed.toString());
}

// Example 3: Merkle Tree for Bitcoin SPV
console.log("\n=== Example 3: Bitcoin Merkle Tree Construction ===");

// Simulate transaction hashes (Bitcoin uses double SHA-256 for each)
const tx1 = new Uint8Array(32).fill(0x11);
const tx2 = new Uint8Array(32).fill(0x22);
const tx3 = new Uint8Array(32).fill(0x33);
const tx4 = new Uint8Array(32).fill(0x44);

console.log("Building Merkle tree for 4 transactions...");

// Combine tx1 and tx2, then double SHA-256
const pair1 = new Uint8Array(64);
pair1.set(tx1, 0);
pair1.set(tx2, 32);

const hash1_first = execute(
	PrecompileAddress.SHA256,
	pair1,
	60n + 12n * 2n,
	Hardfork.CANCUN,
);

const hash1_second = execute(
	PrecompileAddress.SHA256,
	hash1_first.output,
	60n + 12n,
	Hardfork.CANCUN,
);

console.log(
	"Node 1 (tx1+tx2):",
	"0x" + Buffer.from(hash1_second.output).toString("hex").slice(0, 16) + "...",
);

// Combine tx3 and tx4, then double SHA-256
const pair2 = new Uint8Array(64);
pair2.set(tx3, 0);
pair2.set(tx4, 32);

const hash2_first = execute(
	PrecompileAddress.SHA256,
	pair2,
	60n + 12n * 2n,
	Hardfork.CANCUN,
);

const hash2_second = execute(
	PrecompileAddress.SHA256,
	hash2_first.output,
	60n + 12n,
	Hardfork.CANCUN,
);

console.log(
	"Node 2 (tx3+tx4):",
	"0x" + Buffer.from(hash2_second.output).toString("hex").slice(0, 16) + "...",
);

// Combine nodes to get merkle root
const root = new Uint8Array(64);
root.set(hash1_second.output, 0);
root.set(hash2_second.output, 32);

const root_first = execute(
	PrecompileAddress.SHA256,
	root,
	60n + 12n * 2n,
	Hardfork.CANCUN,
);

const merkleRoot = execute(
	PrecompileAddress.SHA256,
	root_first.output,
	60n + 12n,
	Hardfork.CANCUN,
);

console.log(
	"Merkle root:",
	"0x" + Buffer.from(merkleRoot.output).toString("hex"),
);

// Calculate total gas for merkle tree
const totalMerkleGas =
	hash1_first.gasUsed +
	hash1_second.gasUsed +
	hash2_first.gasUsed +
	hash2_second.gasUsed +
	root_first.gasUsed +
	merkleRoot.gasUsed;
console.log("Total gas for 4-tx merkle tree:", totalMerkleGas.toString());

// Example 4: Gas comparison with Keccak256
console.log("\n=== Example 4: SHA-256 vs Keccak256 Gas Costs ===");
console.log("Operation: Hash 1000 bytes");

const largeData = new Uint8Array(1000);
const sha256Words = Math.ceil(1000 / 32);
const sha256Gas = 60n + 12n * BigInt(sha256Words);
const keccak256Gas = 30n + 6n * BigInt(sha256Words); // Keccak256 formula

console.log("SHA-256 gas:", sha256Gas.toString());
console.log("Keccak256 gas:", keccak256Gas.toString(), "(would be)");
console.log(
	"Difference:",
	(sha256Gas - keccak256Gas).toString(),
	"gas more expensive",
);
console.log("\nRecommendation: Use Keccak256 for Ethereum-native hashing");
console.log(
	"Use SHA-256 when interoperating with Bitcoin or other SHA-256 systems",
);

console.log("\n=== Summary ===");
console.log(
	"Bitcoin block hash: 2 SHA-256 calls (~144 gas for 80-byte header)",
);
console.log("Bitcoin address: SHA-256 + RIPEMD-160 (~792 gas)");
console.log("4-tx Merkle tree: 6 double SHA-256 calls (~864 gas)");
console.log("SPV proof verification: Proportional to tree depth");
