import { KZG } from "voltaire";
// Example: Demonstrating cryptographic binding of commitments

KZG.loadTrustedSetup();
const blob1 = KZG.generateRandomBlob();
const commitment1a = KZG.Commitment(blob1);
const commitment1b = KZG.Commitment(blob1);
const deterministic = commitment1a.length === commitment1b.length && commitment1a.every((b, i) => b === commitment1b[i]);
const blob2 = KZG.generateRandomBlob();
const commitment2 = KZG.Commitment(blob2);
const different = !(commitment1a.length === commitment2.length && commitment1a.every((b, i) => b === commitment2[i]));
const blob3 = new Uint8Array(blob1);
blob3[1000] ^= 1; // Flip one bit in middle of blob
const commitment3 = KZG.Commitment(blob3);
const sensitive = !(commitment1a.length === commitment3.length && commitment1a.every((b, i) => b === commitment3[i]));
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
