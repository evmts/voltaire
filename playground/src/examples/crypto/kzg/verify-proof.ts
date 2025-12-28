import { Bytes, KZG } from "@tevm/voltaire";
// Example: Verifying KZG proofs

KZG.loadTrustedSetup();

// Setup
const blob = KZG.generateRandomBlob();
const commitment = KZG.Commitment(blob);

const z = Bytes([...Array(31).fill(0), 0x42]);

const { proof, y } = KZG.Proof(blob, z);
const validResult = KZG.verifyKzgProof(commitment, z, y, proof);
const differentBlob = KZG.generateRandomBlob();
const wrongCommitment = KZG.Commitment(differentBlob);
const wrongCommitmentResult = KZG.verifyKzgProof(wrongCommitment, z, y, proof);
const wrongZ = Bytes([...Array(31).fill(0), 0x99]);
const wrongZResult = KZG.verifyKzgProof(commitment, wrongZ, y, proof);
const corruptedProof = Bytes(proof);
corruptedProof[10] ^= 1; // Flip one bit
const corruptedProofResult = KZG.verifyKzgProof(
	commitment,
	z,
	y,
	corruptedProof,
);
const wrongY = Bytes(y);
wrongY[31] ^= 1; // Flip one bit
const wrongYResult = KZG.verifyKzgProof(commitment, z, wrongY, proof);

KZG.freeTrustedSetup();
