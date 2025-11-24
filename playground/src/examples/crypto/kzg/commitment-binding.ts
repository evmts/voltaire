import { KZG } from "../../../crypto/KZG/index.js";

// Example: Demonstrating cryptographic binding of commitments

KZG.loadTrustedSetup();
const blob1 = KZG.generateRandomBlob();
const commitment1a = KZG.Commitment(blob1);
const commitment1b = KZG.Commitment(blob1);
const deterministic = Buffer.from(commitment1a).equals(
	Buffer.from(commitment1b),
);
const blob2 = KZG.generateRandomBlob();
const commitment2 = KZG.Commitment(blob2);
const different = !Buffer.from(commitment1a).equals(Buffer.from(commitment2));
const blob3 = new Uint8Array(blob1);
blob3[1000] ^= 1; // Flip one bit in middle of blob
const commitment3 = KZG.Commitment(blob3);
const sensitive = !Buffer.from(commitment1a).equals(Buffer.from(commitment3));
const z = new Uint8Array(32);
z[0] = 0;
z[31] = 0x42;

const { proof: proof1, y: y1 } = KZG.Proof(blob1, z);
const valid1 = KZG.verifyKzgProof(commitment1a, z, y1, proof1);

const valid2 = KZG.verifyKzgProof(commitment2, z, y1, proof1);
const { proof: proof3, y: y3 } = KZG.Proof(blob1, z);
const wrongY = new Uint8Array(y3);
wrongY[31] ^= 1; // Change y value
const validWrong = KZG.verifyKzgProof(commitment1a, z, wrongY, proof3);

KZG.freeTrustedSetup();
