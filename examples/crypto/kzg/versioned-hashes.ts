/**
 * Versioned Hash Management Example
 *
 * Demonstrates:
 * - Computing versioned hashes from commitments
 * - Understanding version byte semantics
 * - Hash verification workflow
 * - Future versioning considerations
 */

import { KZG } from "../../../src/crypto/KZG/KZG.js";
import { SHA256 } from "../../../src/crypto/SHA256/index.js";
import * as Hash from "../../../src/primitives/Hash/index.js";
import * as Hex from "../../../src/primitives/Hex/index.js";

// Initialize KZG
KZG.loadTrustedSetup();

const blob = KZG.generateRandomBlob();
const commitment = KZG.blobToKzgCommitment(blob);

// Compute SHA-256 of commitment
const commitmentHash = SHA256.hash(commitment);

// Create versioned hash
const versionedHash = new Uint8Array(32);
versionedHash.set(commitmentHash);
versionedHash[0] = 0x01; // Version byte for EIP-4844

const version = versionedHash[0];
const hashSuffix = versionedHash.slice(1);
if (version === 0x01) {
} else {
}

function verifyVersionedHash(
	versionedHash: Uint8Array,
	commitment: Uint8Array,
): { valid: boolean; reason?: string } {
	// Check length
	if (versionedHash.length !== 32) {
		return { valid: false, reason: "Wrong length (must be 32 bytes)" };
	}

	// Check version byte
	if (versionedHash[0] !== 0x01) {
		return { valid: false, reason: "Unsupported version (must be 0x01)" };
	}

	// Compute expected hash
	const expectedHash = SHA256.hash(commitment);
	expectedHash[0] = 0x01;

	// Compare
	const matches = expectedHash.every((byte, i) => byte === versionedHash[i]);
	if (!matches) {
		return { valid: false, reason: "Hash mismatch" };
	}

	return { valid: true };
}

const result = verifyVersionedHash(versionedHash, commitment);
if (result.reason) {
}

// Test 1: Wrong version
const wrongVersion = new Uint8Array(versionedHash);
wrongVersion[0] = 0x02;
const test1 = verifyVersionedHash(wrongVersion, commitment);

// Test 2: Wrong hash
const wrongHash = new Uint8Array(32);
wrongHash[0] = 0x01;
crypto.getRandomValues(wrongHash.slice(1));
const test2 = verifyVersionedHash(wrongHash, commitment);

// Test 3: Wrong commitment
const blob2 = KZG.generateRandomBlob();
const commitment2 = KZG.blobToKzgCommitment(blob2);
const test3 = verifyVersionedHash(versionedHash, commitment2);

const blobs = [
	KZG.generateRandomBlob(),
	KZG.generateRandomBlob(),
	KZG.generateRandomBlob(),
];

const commitments = blobs.map((b) => KZG.blobToKzgCommitment(b));
const versionedHashes = commitments.map((c) => {
	const hash = SHA256.hash(c);
	hash[0] = 0x01;
	return hash;
});
for (let i = 0; i < versionedHashes.length; i++) {
	// Verify each
	const verify = verifyVersionedHash(versionedHashes[i], commitments[i]);
}

const NUM_BLOBS = 6; // Maximum

function commitmentToVersionedHash(commitment: Uint8Array): Uint8Array {
	const hash = SHA256.hash(commitment);
	hash[0] = 0x01;
	return hash;
}

function parseVersionedHash(hash: Uint8Array): {
	version: number;
	hashSuffix: Uint8Array;
} {
	return {
		version: hash[0],
		hashSuffix: hash.slice(1),
	};
}

// Example usage
const testCommitment = KZG.blobToKzgCommitment(KZG.generateRandomBlob());
const testHash = commitmentToVersionedHash(testCommitment);
const parsed = parseVersionedHash(testHash);

// Cleanup
KZG.freeTrustedSetup();
