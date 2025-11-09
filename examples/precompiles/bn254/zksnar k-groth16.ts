import {
	PrecompileAddress,
	execute,
} from "../../../src/precompiles/precompiles.js";
import { Hardfork } from "../../../src/primitives/Hardfork/index.js";

/**
 * Convert bigint to 32-byte big-endian
 */
function toBigEndian(value: bigint): Uint8Array {
	const bytes = new Uint8Array(32);
	for (let i = 0; i < 32; i++) {
		bytes[31 - i] = Number((value >> BigInt(i * 8)) & 0xffn);
	}
	return bytes;
}

/**
 * Read bigint from bytes
 */
function fromBigEndian(bytes: Uint8Array): bigint {
	let value = 0n;
	for (let i = 0; i < Math.min(32, bytes.length); i++) {
		value = (value << 8n) | BigInt(bytes[i]);
	}
	return value;
}

// G1 generator
const G1_GENERATOR = {
	x: 1n,
	y: 2n,
};

// G2 generator
const G2_GENERATOR = {
	x1: 0x1800deef121f1e76426a00665e5c4479674322d4f75edadd46debd5cd992f6edn,
	x2: 0x198e9393920d483a7260bfb731fb5d25f1aa493335a9e71297e485b7aef312c2n,
	y1: 0x12c85ea5db8c6deb4aab71808dcb408fe3d1e7690c43d37b4ce6cc0166fa7daan,
	y2: 0x090689d0585ff075ec9e99ad690c3395bc4b313370b38ef355acdadcd122975bn,
};

/**
 * Negate a G1 point (flip y-coordinate)
 */
function negateG1(x: bigint, y: bigint): { x: bigint; y: bigint } {
	const FIELD_MODULUS =
		21888242871839275222246405745257275088696311157297823662689037894645226208583n;
	return {
		x,
		y: FIELD_MODULUS - y,
	};
}

/**
 * Serialize G1 point (64 bytes)
 */
function serializeG1(x: bigint, y: bigint): Uint8Array {
	const bytes = new Uint8Array(64);
	bytes.set(toBigEndian(x), 0);
	bytes.set(toBigEndian(y), 32);
	return bytes;
}

/**
 * Serialize G2 point (128 bytes)
 */
function serializeG2(
	x1: bigint,
	x2: bigint,
	y1: bigint,
	y2: bigint,
): Uint8Array {
	const bytes = new Uint8Array(128);
	bytes.set(toBigEndian(x1), 0);
	bytes.set(toBigEndian(x2), 32);
	bytes.set(toBigEndian(y1), 64);
	bytes.set(toBigEndian(y2), 96);
	return bytes;
}

// Verify: e(G1, G2) * e(-G1, G2) = 1
// This should return true (identity)

const pair1Input = new Uint8Array(384); // 2 pairs

// First pair: (G1, G2)
pair1Input.set(serializeG1(G1_GENERATOR.x, G1_GENERATOR.y), 0);
pair1Input.set(
	serializeG2(
		G2_GENERATOR.x1,
		G2_GENERATOR.x2,
		G2_GENERATOR.y1,
		G2_GENERATOR.y2,
	),
	64,
);

// Second pair: (-G1, G2)
const negG1 = negateG1(G1_GENERATOR.x, G1_GENERATOR.y);
pair1Input.set(serializeG1(negG1.x, negG1.y), 192);
pair1Input.set(
	serializeG2(
		G2_GENERATOR.x1,
		G2_GENERATOR.x2,
		G2_GENERATOR.y1,
		G2_GENERATOR.y2,
	),
	256,
);

const pair1Result = execute(
	PrecompileAddress.BN254_PAIRING,
	pair1Input,
	150000n,
	Hardfork.CANCUN,
);

if (pair1Result.success) {
	const isValid = pair1Result.output[31] === 1;
} else {
}

// Simulated proof (in reality, these come from prover)
const proof = {
	A: { x: 123n, y: 456n }, // Simplified, not real values
	B: { x1: 789n, x2: 101n, y1: 112n, y2: 131n },
	C: { x: 415n, y: 161n },
};

// Simulated verification key (from trusted setup)
const vk = {
	alpha: { x: 1n, y: 2n }, // G1
	beta: {
		x1: G2_GENERATOR.x1,
		x2: G2_GENERATOR.x2,
		y1: G2_GENERATOR.y1,
		y2: G2_GENERATOR.y2,
	}, // G2
	gamma: {
		x1: G2_GENERATOR.x1,
		x2: G2_GENERATOR.x2,
		y1: G2_GENERATOR.y1,
		y2: G2_GENERATOR.y2,
	}, // G2
	delta: {
		x1: G2_GENERATOR.x1,
		x2: G2_GENERATOR.x2,
		y1: G2_GENERATOR.y1,
		y2: G2_GENERATOR.y2,
	}, // G2
	IC: [{ x: 1n, y: 2n }], // G1 points for public inputs
};

// Public input (what we're proving about)
const publicInput = [42n];

// In real verification, we'd compute L using ECADD and ECMUL
// L = IC[0] + publicInput[0] × IC[1] + ...
// For demonstration, we use IC[0]
const L = vk.IC[0];

// Build pairing input: 4 pairs (768 bytes)
const grothInput = new Uint8Array(768);

// Pair 1: e(-A, B)
const negA = negateG1(proof.A.x, proof.A.y);
grothInput.set(serializeG1(negA.x, negA.y), 0);
grothInput.set(serializeG2(proof.B.x1, proof.B.x2, proof.B.y1, proof.B.y2), 64);

// Pair 2: e(α, β)
grothInput.set(serializeG1(vk.alpha.x, vk.alpha.y), 192);
grothInput.set(
	serializeG2(vk.beta.x1, vk.beta.x2, vk.beta.y1, vk.beta.y2),
	256,
);

// Pair 3: e(-L, γ)
const negL = negateG1(L.x, L.y);
grothInput.set(serializeG1(negL.x, negL.y), 384);
grothInput.set(
	serializeG2(vk.gamma.x1, vk.gamma.x2, vk.gamma.y1, vk.gamma.y2),
	448,
);

// Pair 4: e(C, δ)
grothInput.set(serializeG1(proof.C.x, proof.C.y), 576);
grothInput.set(
	serializeG2(vk.delta.x1, vk.delta.x2, vk.delta.y1, vk.delta.y2),
	640,
);

const grothResult = execute(
	PrecompileAddress.BN254_PAIRING,
	grothInput,
	200000n,
	Hardfork.CANCUN,
);

if (grothResult.success) {
	const isValid = grothResult.output[31] === 1;
} else {
}

const emptyInput = new Uint8Array(0);

const emptyResult = execute(
	PrecompileAddress.BN254_PAIRING,
	emptyInput,
	50000n,
	Hardfork.CANCUN,
);

if (emptyResult.success) {
	const isValid = emptyResult.output[31] === 1;
}
