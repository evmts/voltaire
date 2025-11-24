import { KZG } from "../../../crypto/KZG/index.js";

// Example: Verifying KZG proofs

KZG.loadTrustedSetup();

// Setup
const blob = KZG.generateRandomBlob();
const commitment = KZG.Commitment(blob);

const z = new Uint8Array(32);
z[0] = 0;
z[31] = 0x42;

const { proof, y } = KZG.Proof(blob, z);
const validResult = KZG.verifyKzgProof(commitment, z, y, proof);
const differentBlob = KZG.generateRandomBlob();
const wrongCommitment = KZG.Commitment(differentBlob);
const wrongCommitmentResult = KZG.verifyKzgProof(wrongCommitment, z, y, proof);
const wrongZ = new Uint8Array(32);
wrongZ[0] = 0;
wrongZ[31] = 0x99;
const wrongZResult = KZG.verifyKzgProof(commitment, wrongZ, y, proof);
const corruptedProof = new Uint8Array(proof);
corruptedProof[10] ^= 1; // Flip one bit
const corruptedProofResult = KZG.verifyKzgProof(
	commitment,
	z,
	y,
	corruptedProof,
);
const wrongY = new Uint8Array(y);
wrongY[31] ^= 1; // Flip one bit
const wrongYResult = KZG.verifyKzgProof(commitment, z, wrongY, proof);

KZG.freeTrustedSetup();
