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

console.log("=== Basic KZG Commitment ===\n");

// Step 1: Load trusted setup (required once before any KZG operations)
console.log("1. Loading Trusted Setup");
console.log("-".repeat(50));
KZG.loadTrustedSetup();
console.log("Trusted setup loaded:", KZG.isInitialized() ? "✓" : "✗");
console.log();

// Step 2: Create a blob (128 KB of data)
console.log("2. Creating Blob");
console.log("-".repeat(50));

// Create empty blob
const emptyBlob = KZG.createEmptyBlob();
console.log("Empty blob size:", emptyBlob.length, "bytes (128 KB)");

// Create random blob (simulates real L2 rollup data)
const blob = KZG.generateRandomBlob();
console.log("Random blob created:", blob.length, "bytes");
console.log("First 32 bytes:", Hex.fromBytes(blob.slice(0, 32)));
console.log();

// Step 3: Validate blob
console.log("3. Validating Blob");
console.log("-".repeat(50));
try {
	KZG.validateBlob(blob);
	console.log("Blob validation: ✓ Valid");
} catch (error) {
	console.log("Blob validation: ✗ Invalid");
	console.error(error);
}
console.log();

// Step 4: Generate KZG commitment
console.log("4. Generating KZG Commitment");
console.log("-".repeat(50));

const commitment = KZG.blobToKzgCommitment(blob);
console.log(
	"Commitment size:",
	commitment.length,
	"bytes (48 bytes = BLS12-381 G1 point)",
);
console.log("Commitment:", Hex.fromBytes(commitment));
console.log();

// Step 5: Commitment is deterministic
console.log("5. Commitment Determinism");
console.log("-".repeat(50));

const commitment2 = KZG.blobToKzgCommitment(blob);
const areEqual = commitment.every((byte, i) => byte === commitment2[i]);
console.log("Same blob produces same commitment:", areEqual ? "✓" : "✗");
console.log();

// Step 6: Different blobs produce different commitments
console.log("6. Commitment Uniqueness");
console.log("-".repeat(50));

const blob2 = KZG.generateRandomBlob();
const commitment3 = KZG.blobToKzgCommitment(blob2);
const areDifferent = !commitment.every((byte, i) => byte === commitment3[i]);
console.log(
	"Different blobs produce different commitments:",
	areDifferent ? "✓" : "✗",
);
console.log();

// Step 7: Commitment binding
console.log("7. Understanding Commitment Binding");
console.log("-".repeat(50));
console.log("The KZG commitment is:");
console.log("  - Succinct: 48 bytes for 128 KB blob");
console.log("  - Binding: Cannot change blob after commitment");
console.log("  - Hiding: Commitment reveals nothing about blob");
console.log("  - Verifiable: Can prove blob(z) = y at any point z");
console.log();

// Step 8: Multiple blobs
console.log("8. Processing Multiple Blobs");
console.log("-".repeat(50));

const blobs = [
	KZG.generateRandomBlob(),
	KZG.generateRandomBlob(),
	KZG.generateRandomBlob(),
];

console.log("Processing", blobs.length, "blobs...");
const commitments = blobs.map((b) => KZG.blobToKzgCommitment(b));
console.log("Generated", commitments.length, "commitments");

for (let i = 0; i < commitments.length; i++) {
	console.log(
		`  Blob ${i + 1}:`,
		Hex.fromBytes(commitments[i]).slice(0, 20) + "...",
	);
}
console.log();

// Cleanup
KZG.freeTrustedSetup();
console.log("Trusted setup freed");
console.log();

console.log("=== Key Takeaways ===");
console.log("- Load trusted setup before using KZG");
console.log("- Blobs are exactly 131,072 bytes (128 KB)");
console.log("- Commitments are 48 bytes (BLS12-381 G1 point)");
console.log("- Same blob → same commitment (deterministic)");
console.log("- Different blobs → different commitments (unique)");
console.log("- Commitment is succinct and binding");
