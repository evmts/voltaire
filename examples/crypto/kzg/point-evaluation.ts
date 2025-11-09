/**
 * Point Evaluation Precompile Example
 *
 * Demonstrates EIP-4844 point evaluation precompile (0x0a):
 * - Preparing input for precompile
 * - Computing versioned hash
 * - Calling point evaluation precompile
 * - Understanding precompile output
 */

import { KZG } from "../../../src/crypto/KZG/KZG.js";
import { SHA256 } from "../../../src/crypto/SHA256/index.js";
import * as Hex from "../../../src/primitives/Hex/index.js";

// Initialize KZG
KZG.loadTrustedSetup();

const blob = KZG.generateRandomBlob();
const commitment = KZG.blobToKzgCommitment(blob);

// Versioned hash = SHA256(commitment) with version byte 0x01
const commitmentHash = SHA256.hash(commitment);
const versionedHash = new Uint8Array(32);
versionedHash.set(commitmentHash);
versionedHash[0] = 0x01; // Version byte for EIP-4844

const z = new Uint8Array(32);
crypto.getRandomValues(z);
z[0] = 0; // Ensure < BLS12-381 modulus

const { proof, y } = KZG.computeKzgProof(blob, z);

// Input format (exactly 192 bytes):
// Offset | Length | Description
// -------|--------|-------------
// 0      | 32     | versioned_hash
// 32     | 32     | z (evaluation point)
// 64     | 32     | y (claimed value)
// 96     | 48     | commitment
// 144    | 48     | proof

const precompileInput = new Uint8Array(192);
precompileInput.set(versionedHash, 0); // bytes 0-31
precompileInput.set(z, 32); // bytes 32-63
precompileInput.set(y, 64); // bytes 64-95
precompileInput.set(commitment, 96); // bytes 96-143
precompileInput.set(proof, 144); // bytes 144-191

// First, verify versioned hash matches commitment
const expectedHash = SHA256.hash(commitment);
expectedHash[0] = 0x01;
const hashMatches = expectedHash.every((byte, i) => byte === versionedHash[i]);

// Verify KZG proof
const proofValid = KZG.verifyKzgProof(commitment, z, y, proof);

const precompileSuccess = hashMatches && proofValid;

if (precompileSuccess) {
	// Success output (64 bytes):
	// Bytes 0-31: FIELD_ELEMENTS_PER_BLOB (0x1000 = 4096)
	// Bytes 32-63: BLS_MODULUS

	const FIELD_ELEMENTS_PER_BLOB = 4096;
	const BLS_MODULUS =
		"0x73eda753299d7d483339d80809a1d80553bda402fffe5bfeffffffff00000001";
} else {
}

// Test 1: Wrong versioned hash
const wrongHash = new Uint8Array(32).fill(0xff);
const wrongHashInput = new Uint8Array(precompileInput);
wrongHashInput.set(wrongHash, 0);

const wrongHashValid = (() => {
	const hash = wrongHashInput.slice(0, 32);
	const expectedH = SHA256.hash(commitment);
	expectedH[0] = 0x01;
	return hash.every((byte, i) => byte === expectedH[i]);
})();

// Test 2: Wrong proof
const wrongProof = new Uint8Array(48);
crypto.getRandomValues(wrongProof);
wrongProof[0] = 0xc0; // Valid BLS point marker

try {
	const wrongProofValid = KZG.verifyKzgProof(commitment, z, y, wrongProof);
} catch (error) {}

// Cleanup
KZG.freeTrustedSetup();
