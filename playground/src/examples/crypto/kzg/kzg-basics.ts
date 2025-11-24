import { KZG } from "../../../crypto/KZG/index.js";

// Example: KZG basics for EIP-4844 blob commitments

// Initialize trusted setup (required once before any KZG operations)
KZG.loadTrustedSetup();
// Create blob (131072 bytes = 128 KB = 4096 field elements)
const blob = KZG.generateRandomBlob();

// Validate blob structure
KZG.validateBlob(blob);
// Generate KZG commitment from blob (48-byte BLS12-381 G1 point)
const commitment = KZG.Commitment(blob);
// Create evaluation point (32-byte field element)
const z = new Uint8Array(32);
z[0] = 0; // Ensure valid field element
z[31] = 0x42;

// Compute proof at evaluation point z
const { proof, y } = KZG.Proof(blob, z);
// Verify that P(z) = y given commitment to P
const isValid = KZG.verifyKzgProof(commitment, z, y, proof);

// Cleanup
KZG.freeTrustedSetup();
