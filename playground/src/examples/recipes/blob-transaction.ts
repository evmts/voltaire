import {
	Address,
	Hex,
	Keccak256,
	Secp256k1,
	Transaction,
	Blob,
	SHA256,
} from "@tevm/voltaire";

// === EIP-4844 Blob Transaction Recipe ===
// This recipe demonstrates how to create blob-carrying transactions
// for L2 data availability (Ethereum's "Danksharding" upgrade)

console.log("=== EIP-4844 Blob Transaction Recipe ===\n");

// === Step 1: Understanding blob transactions ===
console.log("Step 1: Understanding Blob Transactions");
console.log("-".repeat(50));

console.log(`
EIP-4844 introduces "blob-carrying transactions" (Type 3) for L2 scaling:

Key concepts:
- Blobs: 128KB chunks of data (4096 field elements x 32 bytes)
- Commitments: KZG polynomial commitments to blobs
- Proofs: KZG proofs for data availability verification
- Versioned hashes: Commitments hashed with SHA256 (version 0x01)

Use cases:
- L2 rollup data posting (Optimism, Arbitrum, Base, etc.)
- Cheaper data availability than calldata
- Proto-danksharding (future full sharding)

Blob gas:
- Separate fee market from regular gas
- Base blob fee adjusts based on target usage
- Currently: 3 blobs/block target, 6 blobs/block max
`);

// === Step 2: Set up accounts ===
console.log("\nStep 2: Set up accounts");
console.log("-".repeat(50));

const privateKey = Secp256k1.randomPrivateKey();
const publicKey = Secp256k1.derivePublicKey(privateKey);
const senderAddress = Address.fromPublicKey(publicKey);

// L2 batch submitter contract (example)
const batchInbox = Address.fromHex(
	"0xFF00000000000000000000000000000000000010", // Example Optimism batch inbox
);

console.log(`Sender (L2 sequencer): ${Address.toChecksummed(senderAddress)}`);
console.log(`Batch inbox: ${Address.toChecksummed(batchInbox)}`);

// === Step 3: Create blob data ===
console.log("\n\nStep 3: Create Blob Data");
console.log("-".repeat(50));

// Example L2 batch data (would be compressed transactions in practice)
const l2BatchData = new TextEncoder().encode(
	JSON.stringify({
		batchNumber: 12345,
		transactions: [
			{ from: "0x123...", to: "0x456...", value: "1000000000000000000" },
			{ from: "0x789...", to: "0xabc...", value: "2000000000000000000" },
		],
		stateRoot: "0x" + "ab".repeat(32),
		timestamp: Date.now(),
	}),
);

console.log(`L2 batch data size: ${l2BatchData.length} bytes`);
console.log(`Sample data: ${new TextDecoder().decode(l2BatchData.slice(0, 100))}...`);

// Blob constants
console.log(`\nBlob constants:`);
console.log(`  SIZE: ${Blob.SIZE} bytes (128KB)`);
console.log(`  FIELD_ELEMENTS: ${Blob.FIELD_ELEMENTS_PER_BLOB}`);
console.log(`  BYTES_PER_ELEMENT: ${Blob.BYTES_PER_FIELD_ELEMENT}`);
console.log(`  MAX_PER_TX: ${Blob.MAX_PER_TRANSACTION}`);

// Estimate how many blobs needed
const blobsNeeded = Blob.estimateBlobCount(l2BatchData.length);
console.log(`\nBlobs needed for ${l2BatchData.length} bytes: ${blobsNeeded}`);

// === Step 4: Encode data into blobs ===
console.log("\n\nStep 4: Encode Data into Blobs");
console.log("-".repeat(50));

// For small data, encode into a single blob with length prefix
// Format: [length (4 bytes)] + [data] + [padding]
const dataWithLength = new Uint8Array(4 + l2BatchData.length);

// 4-byte big-endian length prefix
const len = l2BatchData.length;
dataWithLength[0] = (len >> 24) & 0xff;
dataWithLength[1] = (len >> 16) & 0xff;
dataWithLength[2] = (len >> 8) & 0xff;
dataWithLength[3] = len & 0xff;
dataWithLength.set(l2BatchData, 4);

console.log(`Data with length prefix: ${dataWithLength.length} bytes`);

// Create blob from data (auto-pads to 128KB)
// Note: In practice, you'd use Blob.fromData which handles encoding
const blobData = new Uint8Array(Blob.SIZE);
blobData.set(dataWithLength, 0);
// Remaining bytes are zero-padded

// Validate blob
const isValidBlob = Blob.isValid(blobData);
console.log(`Blob valid: ${isValidBlob}`);
console.log(`Blob size: ${blobData.length} bytes`);

// === Step 5: Create KZG commitment and proof ===
console.log("\n\nStep 5: Create KZG Commitment and Proof");
console.log("-".repeat(50));

console.log(`
Note: KZG operations require native FFI and trusted setup.
In this demo, we'll show the structure with placeholder values.
For real usage, use the Blob namespace with proper KZG setup.
`);

// In a real implementation:
// const blob = Blob.fromData(l2BatchData);
// const commitment = Blob.toCommitment(blob);
// const proof = Blob.toProof(blob, commitment);
// const versionedHash = Blob.toVersionedHash(commitment);

// Placeholder commitment (48 bytes)
const commitment = new Uint8Array(48);
commitment[0] = 0xc0; // Valid compressed G1 point prefix

// Placeholder proof (48 bytes)
const proof = new Uint8Array(48);
proof[0] = 0xc0;

console.log(`Commitment (48 bytes): ${Hex.fromBytes(commitment.slice(0, 20))}...`);
console.log(`Proof (48 bytes): ${Hex.fromBytes(proof.slice(0, 20))}...`);

// === Step 6: Create versioned hash ===
console.log("\n\nStep 6: Create Versioned Hash");
console.log("-".repeat(50));

// Versioned hash = 0x01 || sha256(commitment)[1:]
// Version byte 0x01 indicates KZG commitment

const commitmentHash = SHA256.hash(commitment);
const versionedHash = new Uint8Array(32);
versionedHash[0] = Blob.COMMITMENT_VERSION_KZG; // 0x01
versionedHash.set(commitmentHash.slice(1), 1);

console.log(`SHA256(commitment): ${Hex.fromBytes(commitmentHash)}`);
console.log(`Versioned hash (v1): ${Hex.fromBytes(versionedHash)}`);
console.log(`Version byte: 0x${versionedHash[0].toString(16).padStart(2, "0")}`);

// Validate versioned hash
const isValidVersion = Blob.isValidVersion(versionedHash);
console.log(`Valid version: ${isValidVersion}`);

// === Step 7: Create blob transaction ===
console.log("\n\nStep 7: Create Blob Transaction (Type 3)");
console.log("-".repeat(50));

// Current blob base fee (would get from network)
const blobBaseFee = 1_000_000_000n; // 1 gwei example

// Blob gas calculation
const blobGasUsed = Blob.calculateGas(1); // 131072 gas per blob
console.log(`Blob gas per blob: ${Blob.GAS_PER_BLOB}`);
console.log(`Total blob gas: ${blobGasUsed}`);

// Create the blob transaction
const blobTx: Transaction.EIP4844 = {
	type: 3,
	chainId: 1n,
	nonce: 0n,
	maxPriorityFeePerGas: 2_000_000_000n, // 2 gwei
	maxFeePerGas: 50_000_000_000n, // 50 gwei
	gasLimit: 21000n, // Minimal for empty calldata
	to: batchInbox,
	value: 0n,
	data: new Uint8Array(0), // Calldata (optional, often empty)
	accessList: [],
	// Blob-specific fields
	maxFeePerBlobGas: 10_000_000_000n, // 10 gwei max blob fee
	blobVersionedHashes: [versionedHash],
};

console.log("Blob Transaction (Type 3):");
console.log(`  type: 3 (EIP-4844)`);
console.log(`  chainId: ${blobTx.chainId}`);
console.log(`  nonce: ${blobTx.nonce}`);
console.log(`  maxPriorityFeePerGas: ${blobTx.maxPriorityFeePerGas / 1_000_000_000n} gwei`);
console.log(`  maxFeePerGas: ${blobTx.maxFeePerGas / 1_000_000_000n} gwei`);
console.log(`  maxFeePerBlobGas: ${blobTx.maxFeePerBlobGas / 1_000_000_000n} gwei`);
console.log(`  to: ${Address.toChecksummed(batchInbox)}`);
console.log(`  blobVersionedHashes: ${blobTx.blobVersionedHashes.length}`);

// === Step 8: Sign the transaction ===
console.log("\n\nStep 8: Sign the Blob Transaction");
console.log("-".repeat(50));

const signingHash = Transaction.getSigningHash(blobTx);
console.log(`Signing hash: ${Hex.fromBytes(signingHash)}`);

const signature = Secp256k1.sign(signingHash, privateKey);

const signedBlobTx: Transaction.EIP4844 = {
	...blobTx,
	r: signature.r,
	s: signature.s,
	v: BigInt(signature.v - 27),
};

console.log("Signature:");
console.log(`  r: ${Hex.fromBytes(signedBlobTx.r)}`);
console.log(`  s: ${Hex.fromBytes(signedBlobTx.s)}`);
console.log(`  yParity: ${signedBlobTx.v}`);

// === Step 9: Serialize transaction ===
console.log("\n\nStep 9: Serialize Transaction");
console.log("-".repeat(50));

// Serialize the signed transaction
const serialized = Transaction.serialize(signedBlobTx);
console.log(`Serialized transaction: ${Hex.fromBytes(serialized.slice(0, 100))}...`);
console.log(`Transaction length: ${serialized.length} bytes`);
console.log(`Type prefix: 0x${serialized[0].toString(16).padStart(2, "0")}`);

// Network form includes blobs, commitments, and proofs
// This is what gets sent to the mempool
console.log(`
Note: Network serialization includes:
  - Signed transaction
  - Blob data (128KB per blob)
  - KZG commitments (48 bytes per blob)
  - KZG proofs (48 bytes per blob)
`);

// === Step 10: Cost calculation ===
console.log("\n=== Cost Calculation ===");
console.log("-".repeat(50));

// Regular gas cost
const regularGasPrice = blobTx.maxFeePerGas;
const regularGasCost = regularGasPrice * blobTx.gasLimit;

// Blob gas cost
const blobGasCost = blobTx.maxFeePerBlobGas * BigInt(blobGasUsed);

// Total cost
const totalCost = regularGasCost + blobGasCost;

console.log("Cost breakdown:");
console.log(`  Regular gas: ${blobTx.gasLimit} x ${regularGasPrice / 1_000_000_000n} gwei`);
console.log(`    = ${regularGasCost / 1_000_000_000n} gwei`);
console.log(`  Blob gas: ${blobGasUsed} x ${blobTx.maxFeePerBlobGas / 1_000_000_000n} gwei`);
console.log(`    = ${blobGasCost / 1_000_000_000n} gwei`);
console.log(`\n  Total: ${totalCost / 1_000_000_000n} gwei`);
console.log(`    = ${Number(totalCost) / 1e18} ETH`);

// Compare to calldata cost
const calldataSize = l2BatchData.length;
const calldataGas = BigInt(calldataSize) * 16n; // 16 gas per non-zero byte
const calldataCost = calldataGas * regularGasPrice;

console.log(`\nComparison to calldata:`);
console.log(`  Data size: ${calldataSize} bytes`);
console.log(`  Calldata gas: ~${calldataGas} (16 gas/byte)`);
console.log(`  Calldata cost: ${calldataCost / 1_000_000_000n} gwei`);
console.log(`\n  Blob savings: ${((Number(calldataCost - blobGasCost) / Number(calldataCost)) * 100).toFixed(1)}%`);

// === Step 11: Multi-blob transaction ===
console.log("\n\n=== Multi-Blob Transaction ===");
console.log("-".repeat(50));

// For larger data, use multiple blobs
const largeDataSize = 300_000; // 300KB
const blobsForLargeData = Blob.estimateBlobCount(largeDataSize);

console.log(`Large data size: ${largeDataSize} bytes`);
console.log(`Blobs needed: ${blobsForLargeData}`);

// Create multiple versioned hashes
const multipleVersionedHashes: Uint8Array[] = [];
for (let i = 0; i < blobsForLargeData; i++) {
	const hash = new Uint8Array(32);
	hash[0] = Blob.COMMITMENT_VERSION_KZG;
	hash[31] = i; // Unique placeholder
	multipleVersionedHashes.push(hash);
}

const multiBlobTx: Transaction.EIP4844 = {
	type: 3,
	chainId: 1n,
	nonce: 1n,
	maxPriorityFeePerGas: 2_000_000_000n,
	maxFeePerGas: 50_000_000_000n,
	gasLimit: 21000n,
	to: batchInbox,
	value: 0n,
	data: new Uint8Array(0),
	accessList: [],
	maxFeePerBlobGas: 10_000_000_000n,
	blobVersionedHashes: multipleVersionedHashes,
};

console.log(`Multi-blob transaction: ${multiBlobTx.blobVersionedHashes.length} blobs`);
console.log(`Total blob gas: ${Blob.calculateGas(multiBlobTx.blobVersionedHashes.length)}`);

// Check blob count
if (Transaction.isEIP4844(multiBlobTx)) {
	const blobCount = Transaction.getBlobCount(multiBlobTx);
	console.log(`Blob count from tx: ${blobCount}`);
}

// === Step 12: Blob gas fee market ===
console.log("\n\n=== Blob Gas Fee Market ===");
console.log("-".repeat(50));

console.log(`
Blob gas has its own EIP-1559-style fee market:

Target: ${Blob.TARGET_GAS_PER_BLOCK} gas/block (3 blobs)
Max: ${Blob.MAX_PER_TRANSACTION * 2} blobs/block (6 blobs)

Blob base fee adjusts:
- Below target: decreases by up to 12.5%
- Above target: increases by up to 12.5%

Current implementations:
- Optimism: Posts batches as blobs
- Arbitrum: Posts data availability as blobs
- Base: Uses blobs for L2 data
- zkSync: Blob support coming
`);

console.log("\n=== Recipe Complete ===");
console.log("\nKey points:");
console.log("1. Type 3 transactions carry 1-6 blobs of 128KB each");
console.log("2. Blobs require KZG commitments and proofs");
console.log("3. Versioned hashes go in transaction, full blobs in network form");
console.log("4. Separate blob gas fee market from regular gas");
console.log("5. ~90% cheaper than equivalent calldata posting");
