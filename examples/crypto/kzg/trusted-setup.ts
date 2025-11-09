/**
 * KZG Trusted Setup Management Example
 *
 * Demonstrates:
 * - Loading and initializing trusted setup
 * - Understanding trusted setup structure
 * - Setup lifecycle management
 * - Security considerations
 */

import { KZG } from "../../../src/crypto/KZG/KZG.js";
import {
	BYTES_PER_BLOB,
	FIELD_ELEMENTS_PER_BLOB,
} from "../../../src/crypto/KZG/constants.js";
KZG.loadTrustedSetup();
KZG.loadTrustedSetup(); // Should be no-op if already loaded

const blob = KZG.generateRandomBlob();

const commitment = KZG.blobToKzgCommitment(blob);
const iterations = 1000;
const testBlob = KZG.generateRandomBlob();

const start = performance.now();
for (let i = 0; i < iterations; i++) {
	KZG.blobToKzgCommitment(testBlob);
}
const elapsed = performance.now() - start;
KZG.freeTrustedSetup();
try {
	const testBlob2 = KZG.generateRandomBlob();
	KZG.blobToKzgCommitment(testBlob2);
} catch (error) {}
KZG.loadTrustedSetup();

// Cleanup
KZG.freeTrustedSetup();
