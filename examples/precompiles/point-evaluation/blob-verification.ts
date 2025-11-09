import {
	PrecompileAddress,
	execute,
} from "../../../src/precompiles/precompiles.js";
import { Hardfork } from "../../../src/primitives/Hardfork/index.js";

const FIELD_ELEMENTS_PER_BLOB = 4096;
const BYTES_PER_FIELD_ELEMENT = 32;
const BLOB_SIZE = FIELD_ELEMENTS_PER_BLOB * BYTES_PER_FIELD_ELEMENT; // 131,072 bytes = 128 KB

/**
 * Mock SHA-256 for demonstration
 */
function mockSha256(data: Uint8Array): Uint8Array {
	const hash = new Uint8Array(32);
	for (let i = 0; i < 32; i++) {
		hash[i] = data[i % data.length] ^ (i * 7);
	}
	return hash;
}

/**
 * Create versioned hash
 */
function versionedHash(commitment: Uint8Array): Uint8Array {
	const hash = mockSha256(commitment);
	hash[0] = 0x01; // EIP-4844 version
	return hash;
}

/**
 * Simulate KZG commitment to blob data
 * In reality: uses c-kzg-4844 library with trusted setup
 */
function computeCommitment(blob: Uint8Array): Uint8Array {
	// Real: commitment = [p(τ)]₁ where p(x) is polynomial from blob
	// Simplified: deterministic but not cryptographically valid
	const commitment = new Uint8Array(48);
	commitment[0] = 0x80 | 0x20; // Compressed G1 point marker (not infinity, positive Y)

	// Derive from blob hash (not secure, just for demo)
	const hash = mockSha256(blob);
	commitment.set(hash.slice(0, 47), 1);

	return commitment;
}

/**
 * Simulate KZG proof generation
 * In reality: proof = [q(τ)]₁ where q(x) = (p(x) - y) / (x - z)
 */
function computeProof(
	blob: Uint8Array,
	commitment: Uint8Array,
	z: Uint8Array,
	y: Uint8Array,
): Uint8Array {
	// Real: uses polynomial division and trusted setup
	// Simplified: deterministic from inputs
	const proof = new Uint8Array(48);
	proof[0] = 0x80 | 0x20; // Compressed G1 point

	const combined = new Uint8Array(commitment.length + z.length + y.length);
	combined.set(commitment, 0);
	combined.set(z, commitment.length);
	combined.set(y, commitment.length + z.length);

	const hash = mockSha256(combined);
	proof.set(hash.slice(0, 47), 1);

	return proof;
}

// Simulate rollup batch data (compressed transactions)
const rollupBatch = new Uint8Array(BLOB_SIZE);
for (let i = 0; i < BLOB_SIZE; i++) {
	// Simulate compressed transaction data
	rollupBatch[i] = (i * 137 + 42) % 256;
}

// Compute KZG commitment
const commitment1 = computeCommitment(rollupBatch);

// Compute versioned hash
const vHash1 = versionedHash(commitment1);

// Evaluation point (random challenge from consensus)
const z1 = new Uint8Array(32);
z1[31] = 42; // Random point

// Claimed value (polynomial evaluation at z)
const y1 = new Uint8Array(32);
y1[31] = 123; // p(z) = 123

// Generate proof
const proof1 = computeProof(rollupBatch, commitment1, z1, y1);

// Assemble precompile input
const input1 = new Uint8Array(192);
input1.set(vHash1, 0);
input1.set(z1, 32);
input1.set(y1, 64);
input1.set(commitment1, 96);
input1.set(proof1, 144);

const result1 = execute(
	PrecompileAddress.POINT_EVALUATION,
	input1,
	60000n,
	Hardfork.CANCUN,
);

if (result1.success) {
	const valid = (result1.output[30] << 8) | result1.output[31];
} else {
}

const NUM_BLOBS = 3; // Typical L1 block can have 3-6 blobs

let totalGas = 0n;
const verifiedBlobs: boolean[] = [];

for (let i = 0; i < NUM_BLOBS; i++) {
	const blob = new Uint8Array(BLOB_SIZE);
	for (let j = 0; j < BLOB_SIZE; j++) {
		blob[j] = ((i + 1) * j * 13 + 7) % 256;
	}

	const commitment = computeCommitment(blob);
	const vHash = versionedHash(commitment);

	const z = new Uint8Array(32);
	z[31] = i + 1;

	const y = new Uint8Array(32);
	y[31] = (i + 1) * 10;

	const proof = computeProof(blob, commitment, z, y);

	const input = new Uint8Array(192);
	input.set(vHash, 0);
	input.set(z, 32);
	input.set(y, 64);
	input.set(commitment, 96);
	input.set(proof, 144);

	const result = execute(
		PrecompileAddress.POINT_EVALUATION,
		input,
		60000n,
		Hardfork.CANCUN,
	);

	if (result.success) {
		const valid = (result.output[30] << 8) | result.output[31];
		verifiedBlobs.push(valid !== 0);
		totalGas += result.gasUsed;
	} else {
		verifiedBlobs.push(false);
	}
}

const BLOB_DATA_SIZE = 128 * 1024; // 128 KB
const CALLDATA_GAS_PER_BYTE = 16; // Non-zero byte cost
const calldataGas = BLOB_DATA_SIZE * CALLDATA_GAS_PER_BYTE;
const blobGas = 50000; // Point evaluation cost
const blobGasPrice = 1; // Typically 1 wei (separate market)

const savingsPercent = (((calldataGas - blobGas) / calldataGas) * 100).toFixed(
	1,
);

const AVG_L2_TX_SIZE = 100; // bytes (compressed)
const TXS_PER_BLOB = Math.floor(BLOB_SIZE / AVG_L2_TX_SIZE);

const BLOBS_PER_L1_BLOCK = 3; // Target
const L1_BLOCK_TIME = 12; // seconds
const L2_TPS = (TXS_PER_BLOB * BLOBS_PER_L1_BLOCK) / L1_BLOCK_TIME;
