import { BN254 } from "../../../src/crypto/bn254/BN254.js";

const g1Gen = BN254.G1.generator();
const g2Gen = BN254.G2.generator();

// A Groth16 proof consists of exactly 3 group elements
interface Groth16Proof {
	A: ReturnType<typeof BN254.G1.generator>; // G1 point (64 bytes)
	B: ReturnType<typeof BN254.G2.generator>; // G2 point (128 bytes)
	C: ReturnType<typeof BN254.G1.generator>; // G1 point (64 bytes)
}

// Example proof (simplified - real proofs computed by prover)
const proof: Groth16Proof = {
	A: BN254.G1.mul(g1Gen, 12345n),
	B: BN254.G2.mul(g2Gen, 67890n),
	C: BN254.G1.mul(g1Gen, 11111n),
};

// Serialize proof for on-chain submission
const proofABytes = BN254.serializeG1(proof.A);
const proofBBytes = BN254.serializeG2(proof.B);
const proofCBytes = BN254.serializeG1(proof.C);

const proofBytes = new Uint8Array(256);
proofBytes.set(proofABytes, 0);
proofBytes.set(proofBBytes, 64);
proofBytes.set(proofCBytes, 192);

interface Groth16VerificationKey {
	alpha: ReturnType<typeof BN254.G1.generator>; // G1
	beta: ReturnType<typeof BN254.G2.generator>; // G2
	gamma: ReturnType<typeof BN254.G2.generator>; // G2
	delta: ReturnType<typeof BN254.G2.generator>; // G2
	IC: ReturnType<typeof BN254.G1.generator>[]; // G1 array (length = num_public_inputs + 1)
}

// Example verification key (from trusted setup)
const vk: Groth16VerificationKey = {
	alpha: BN254.G1.mul(g1Gen, 12345n),
	beta: BN254.G2.mul(g2Gen, 67890n),
	gamma: BN254.G2.mul(g2Gen, 11111n),
	delta: BN254.G2.mul(g2Gen, 22222n),
	IC: [
		BN254.G1.mul(g1Gen, 1000n), // IC[0] - constant term
		BN254.G1.mul(g1Gen, 2000n), // IC[1] - for public input 1
		BN254.G1.mul(g1Gen, 3000n), // IC[2] - for public input 2
	],
};

const vkSize = 64 + 128 + 128 + 128 + vk.IC.length * 64;

// Public inputs are field elements (scalars)
const publicInputs = [42n, 99n];
publicInputs.forEach((input, i) => {});

// Compute L = IC[0] + Σ(public_input[i] × IC[i])
let L = vk.IC[0];
for (let i = 0; i < publicInputs.length; i++) {
	const term = BN254.G1.mul(vk.IC[i + 1], publicInputs[i]);
	L = BN254.G1.add(L, term);
}

// Perform verification
const isValid = BN254.Pairing.pairingCheck([
	[proof.A, proof.B],
	[BN254.G1.negate(vk.alpha), vk.beta],
	[BN254.G1.negate(L), vk.gamma],
	[BN254.G1.negate(proof.C), vk.delta],
]);

// Simulate Tornado Cash public inputs
const tornadoPublicInputs = [
	0x1234567890abcdefn, // Merkle root
	0xfedcba0987654321n, // Nullifier hash
];

const ecpairingBase = 45000;
const ecpairingPerPair = 34000;
const numPairs = 4;

const pairingGas = ecpairingBase + numPairs * ecpairingPerPair;
const deserializationGas = 5000; // Estimate for calldata + deserialization
const inputEncodingGas = 3000; // Computing L from public inputs
const totalGas = pairingGas + deserializationGas + inputEncodingGas;
