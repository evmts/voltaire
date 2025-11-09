/**
 * Basic KZG Commitment Example
 *
 * Demonstrates fundamental KZG operations:
 * - Loading trusted setup
 * - Creating a blob
 * - Generating KZG commitment
 * - Basic validation
 */

import { KZG } from "../../../src/crypto/KZG/KZG.js";
import * as Hex from "../../../src/primitives/Hex/index.js";
KZG.loadTrustedSetup();

// Create empty blob
const emptyBlob = KZG.createEmptyBlob();

// Create random blob (simulates real L2 rollup data)
const blob = KZG.generateRandomBlob();
try {
	KZG.validateBlob(blob);
} catch (error) {
	console.error(error);
}

const commitment = KZG.blobToKzgCommitment(blob);

const commitment2 = KZG.blobToKzgCommitment(blob);
const areEqual = commitment.every((byte, i) => byte === commitment2[i]);

const blob2 = KZG.generateRandomBlob();
const commitment3 = KZG.blobToKzgCommitment(blob2);
const areDifferent = !commitment.every((byte, i) => byte === commitment3[i]);

const blobs = [
	KZG.generateRandomBlob(),
	KZG.generateRandomBlob(),
	KZG.generateRandomBlob(),
];
const commitments = blobs.map((b) => KZG.blobToKzgCommitment(b));

for (let i = 0; i < commitments.length; i++) {}

// Cleanup
KZG.freeTrustedSetup();
