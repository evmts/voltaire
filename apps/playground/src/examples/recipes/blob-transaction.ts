import {
	Address,
	Blob,
	Hex,
	Keccak256,
	SHA256,
	Secp256k1,
	Transaction,
} from "@tevm/voltaire";

const privateKey = Secp256k1.randomPrivateKey();
const publicKey = Secp256k1.derivePublicKey(privateKey);
const senderAddress = Address.fromPublicKey(publicKey);

// L2 batch submitter contract (example)
const batchInbox = Address.fromHex(
	"0xFF00000000000000000000000000000000000010", // Example Optimism batch inbox
);

// Example L2 batch data (would be compressed transactions in practice)
const l2BatchData = new TextEncoder().encode(
	JSON.stringify({
		batchNumber: 12345,
		transactions: [
			{ from: "0x123...", to: "0x456...", value: "1000000000000000000" },
			{ from: "0x789...", to: "0xabc...", value: "2000000000000000000" },
		],
		stateRoot: `0x${"ab".repeat(32)}`,
		timestamp: Date.now(),
	}),
);

// Estimate how many blobs needed
const blobsNeeded = Blob.estimateBlobCount(l2BatchData.length);

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

// Create blob from data (auto-pads to 128KB)
// Note: In practice, you'd use Blob.fromData which handles encoding
const blobData = new Uint8Array(Blob.SIZE);
blobData.set(dataWithLength, 0);
// Remaining bytes are zero-padded

// Validate blob
const isValidBlob = Blob.isValid(blobData);

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

// Versioned hash = 0x01 || sha256(commitment)[1:]
// Version byte 0x01 indicates KZG commitment

const commitmentHash = SHA256.hash(commitment);
const versionedHash = new Uint8Array(32);
versionedHash[0] = Blob.COMMITMENT_VERSION_KZG; // 0x01
versionedHash.set(commitmentHash.slice(1), 1);

// Validate versioned hash
const isValidVersion = Blob.isValidVersion(versionedHash);

// Current blob base fee (would get from network)
const blobBaseFee = 1_000_000_000n; // 1 gwei example

// Blob gas calculation
const blobGasUsed = Blob.calculateGas(1); // 131072 gas per blob

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

const signingHash = Transaction.getSigningHash(blobTx);

const signature = Secp256k1.sign(signingHash, privateKey);

const signedBlobTx: Transaction.EIP4844 = {
	...blobTx,
	r: signature.r,
	s: signature.s,
	v: BigInt(signature.v - 27),
};

// Serialize the signed transaction
const serialized = Transaction.serialize(signedBlobTx);

// Regular gas cost
const regularGasPrice = blobTx.maxFeePerGas;
const regularGasCost = regularGasPrice * blobTx.gasLimit;

// Blob gas cost
const blobGasCost = blobTx.maxFeePerBlobGas * BigInt(blobGasUsed);

// Total cost
const totalCost = regularGasCost + blobGasCost;

// Compare to calldata cost
const calldataSize = l2BatchData.length;
const calldataGas = BigInt(calldataSize) * 16n; // 16 gas per non-zero byte
const calldataCost = calldataGas * regularGasPrice;

// For larger data, use multiple blobs
const largeDataSize = 300_000; // 300KB
const blobsForLargeData = Blob.estimateBlobCount(largeDataSize);

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

// Check blob count
if (Transaction.isEIP4844(multiBlobTx)) {
	const blobCount = Transaction.getBlobCount(multiBlobTx);
}
