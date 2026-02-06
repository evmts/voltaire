/**
 * KZG Trusted Setup Management Example
 *
 * Demonstrates:
 * - Loading and initializing trusted setup
 * - Understanding trusted setup structure
 * - Setup lifecycle management
 * - Security considerations
 */

import { KZG } from "@tevm/voltaire";
// Note: KZG constants are internal - use the values directly
const BYTES_PER_BLOB = 131072; // 4096 * 32
const FIELD_ELEMENTS_PER_BLOB = 4096;
KZG.loadTrustedSetup();
KZG.loadTrustedSetup(); // Should be no-op if already loaded

const blob = KZG.generateRandomBlob();

const commitment = KZG.Commitment(blob);
const iterations = 1000;
const testBlob = KZG.generateRandomBlob();

const start = performance.now();
for (let i = 0; i < iterations; i++) {
	KZG.Commitment(testBlob);
}
const elapsed = performance.now() - start;
KZG.freeTrustedSetup();
try {
	const testBlob2 = KZG.generateRandomBlob();
	KZG.Commitment(testBlob2);
} catch (error) {}
KZG.loadTrustedSetup();

// Cleanup
KZG.freeTrustedSetup();
