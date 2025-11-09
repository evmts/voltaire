import {
	PrecompileAddress,
	execute,
} from "../../../src/precompiles/precompiles.js";
import { Hardfork } from "../../../src/primitives/Hardfork/index.js";

/**
 * Convert bigint to bytes
 */
function toBytes(value: bigint, length: number): Uint8Array {
	const bytes = new Uint8Array(length);
	for (let i = 0; i < length; i++) {
		bytes[length - 1 - i] = Number((value >> BigInt(i * 8)) & 0xffn);
	}
	return bytes;
}

/**
 * Simple hash for demo (not cryptographically secure)
 */
function mockHash(...inputs: bigint[]): bigint {
	let hash = 0n;
	for (const input of inputs) {
		hash = (hash * 31n + input) % 2n ** 254n;
	}
	return hash;
}

// G1 and G2 generators (simplified)
const G1_GEN = {
	x: 1n,
	y: 2n,
};

const G2_GEN = {
	x1: 0x1800deef121f1e76426a00665e5c4479674322d4f75edadd46debd5cd992f6edn,
	x2: 0x198e9393920d483a7260bfb731fb5d25f1aa493335a9e71297e485b7aef312c2n,
	y1: 0x12c85ea5db8c6deb4aab71808dcb408fe3d1e7690c43d37b4ce6cc0166fa7daan,
	y2: 0x090689d0585ff075ec9e99ad690c3395bc4b313370b38ef355acdadcd122975bn,
};

/**
 * Serialize points
 */
function serializeG1(x: bigint, y: bigint): Uint8Array {
	const bytes = new Uint8Array(64);
	bytes.set(toBytes(x, 32), 0);
	bytes.set(toBytes(y, 32), 32);
	return bytes;
}

function serializeG2(
	x1: bigint,
	x2: bigint,
	y1: bigint,
	y2: bigint,
): Uint8Array {
	const bytes = new Uint8Array(128);
	bytes.set(toBytes(x1, 32), 0);
	bytes.set(toBytes(x2, 32), 32);
	bytes.set(toBytes(y1, 32), 64);
	bytes.set(toBytes(y2, 32), 96);
	return bytes;
}

function negateG1(x: bigint, y: bigint): { x: bigint; y: bigint } {
	const FIELD_MODULUS =
		21888242871839275222246405745257275088696311157297823662689037894645226208583n;
	return { x, y: FIELD_MODULUS - y };
}

// Protocol state
const MERKLE_TREE_HEIGHT = 20;
const DENOMINATION = 1000000000000000000n; // 1 ETH in wei
const deposits: bigint[] = [];
let nextLeafIndex = 0;

// User generates secret and nullifier
const secret = 12345678901234567890n;
const nullifier = 98765432109876543210n;

// Compute commitment
const commitment = mockHash(secret, nullifier);

// Store commitment in Merkle tree
deposits.push(commitment);
const leafIndex = nextLeafIndex++;
for (let i = 0; i < 9; i++) {
	const dummySecret = BigInt(i + 1) * 111111n;
	const dummyNullifier = BigInt(i + 1) * 222222n;
	const dummyCommitment = mockHash(dummySecret, dummyNullifier);
	deposits.push(dummyCommitment);
	nextLeafIndex++;
}

// Compute Merkle root (simplified - real impl uses efficient tree)
let currentHash = commitment;
let pathIndices = leafIndex;
const merklePath: bigint[] = [];

for (let level = 0; level < MERKLE_TREE_HEIGHT; level++) {
	const isRight = (pathIndices & 1) === 1;
	const siblingIndex = isRight ? pathIndices - 1 : pathIndices + 1;

	// Get sibling (or zero if doesn't exist)
	const sibling = siblingIndex < deposits.length ? deposits[siblingIndex] : 0n;

	merklePath.push(sibling);

	// Hash up the tree
	currentHash = isRight
		? mockHash(sibling, currentHash)
		: mockHash(currentHash, sibling);

	pathIndices >>= 1;
}

const merkleRoot = currentHash;

const recipient = 0x742d35cc6634c0532925a3b844bc9e7595f0beb1n; // Recipient address
const relayer = 0x0000000000000000000000000000000000000000n; // No relayer
const fee = 0n;

// Simulated Groth16 proof components
const proof = {
	A: { x: 123n, y: 456n }, // Simplified
	B: { x1: 789n, x2: 101n, y1: 112n, y2: 131n },
	C: { x: 415n, y: 161n },
};

// Verification key (from trusted setup)
const vk = {
	alpha: { x: G1_GEN.x, y: G1_GEN.y },
	beta: { x1: G2_GEN.x1, x2: G2_GEN.x2, y1: G2_GEN.y1, y2: G2_GEN.y2 },
	gamma: { x1: G2_GEN.x1, x2: G2_GEN.x2, y1: G2_GEN.y1, y2: G2_GEN.y2 },
	delta: { x1: G2_GEN.x1, x2: G2_GEN.x2, y1: G2_GEN.y1, y2: G2_GEN.y2 },
	IC: [
		{ x: 1n, y: 2n },
		{ x: 3n, y: 4n },
	], // Per public input
};

// Compute L from public inputs (simplified)
const L = vk.IC[0]; // In reality: IC[0] + publicInput[0]*IC[1] + ...

// Build pairing input
const pairingInput = new Uint8Array(768); // 4 pairs

// Pair 1: e(-A, B)
const negA = negateG1(proof.A.x, proof.A.y);
pairingInput.set(serializeG1(negA.x, negA.y), 0);
pairingInput.set(
	serializeG2(proof.B.x1, proof.B.x2, proof.B.y1, proof.B.y2),
	64,
);

// Pair 2: e(α, β)
pairingInput.set(serializeG1(vk.alpha.x, vk.alpha.y), 192);
pairingInput.set(
	serializeG2(vk.beta.x1, vk.beta.x2, vk.beta.y1, vk.beta.y2),
	256,
);

// Pair 3: e(-L, γ)
const negL = negateG1(L.x, L.y);
pairingInput.set(serializeG1(negL.x, negL.y), 384);
pairingInput.set(
	serializeG2(vk.gamma.x1, vk.gamma.x2, vk.gamma.y1, vk.gamma.y2),
	448,
);

// Pair 4: e(C, δ)
pairingInput.set(serializeG1(proof.C.x, proof.C.y), 576);
pairingInput.set(
	serializeG2(vk.delta.x1, vk.delta.x2, vk.delta.y1, vk.delta.y2),
	640,
);

const verifyResult = execute(
	PrecompileAddress.BN254_PAIRING,
	pairingInput,
	200000n,
	Hardfork.CANCUN,
);

if (verifyResult.success) {
	const isValid = verifyResult.output[31] === 1;
}

const PAIRING_GAS = 181000;
const MERKLE_CHECK_GAS = 10000;
const NULLIFIER_CHECK_GAS = 5000;
const STATE_UPDATE_GAS = 20000;
const TRANSFER_GAS = 35000;

const TOTAL_GAS =
	PAIRING_GAS +
	MERKLE_CHECK_GAS +
	NULLIFIER_CHECK_GAS +
	STATE_UPDATE_GAS +
	TRANSFER_GAS;

const ETH_PRICE = 2000; // USD
const GAS_PRICE_GWEI = 30;
const costUSD = ((Number(TOTAL_GAS) * GAS_PRICE_GWEI) / 1e9) * ETH_PRICE;

const TOTAL_DEPOSITS = deposits.length;
