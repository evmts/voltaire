import { KZG } from "voltaire";
// Example: Generating KZG proofs at evaluation points

KZG.loadTrustedSetup();

// Create blob and commitment
const blob = KZG.generateRandomBlob();
const commitment = KZG.Commitment(blob);

// Helper to create valid field elements
const createFieldElement = (value: number): Uint8Array => {
	const z = new Uint8Array(BYTES_PER_FIELD_ELEMENT);
	z[0] = 0; // Ensure < BLS12-381 modulus
	z[31] = value;
	return z;
};

const evaluationPoints = [0x00, 0x01, 0x42, 0xff];

for (const point of evaluationPoints) {
	const z = createFieldElement(point);
	const { proof, y } = KZG.Proof(blob, z);

	// Verify the proof
	const valid = KZG.verifyKzgProof(commitment, z, y, proof);
}

KZG.freeTrustedSetup();
