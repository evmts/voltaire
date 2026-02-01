import { Bytes, KZG } from "@tevm/voltaire";
// Example: Batch verification of multiple blob proofs

KZG.loadTrustedSetup();

// Create multiple blobs with commitments
const numBlobs = 4;
const blobs: Uint8Array[] = [];
const commitments: Uint8Array[] = [];
const proofs: Uint8Array[] = [];

for (let i = 0; i < numBlobs; i++) {
	const blob = KZG.generateRandomBlob();
	const commitment = KZG.Commitment(blob);

	// For batch verification, use specialized blob proofs
	// (Note: simplified example - real blob proofs have specific format)
	const z = Bytes([...Array(31).fill(0), i]);
	const { proof } = KZG.Proof(blob, z);

	blobs.push(blob);
	commitments.push(commitment);
	proofs.push(proof);
}
const individualStart = performance.now();

for (let i = 0; i < numBlobs; i++) {
	const z = Bytes([...Array(31).fill(0), i]);
	const { y } = KZG.Proof(blobs[i], z);
	KZG.verifyKzgProof(commitments[i], z, y, proofs[i]);
}

const individualTime = performance.now() - individualStart;

const batchStart = performance.now();
try {
	KZG.verifyBlobKzgProofBatch(blobs, commitments, proofs);
	const batchTime = performance.now() - batchStart;

	if (individualTime > 0) {
		const _speedup = individualTime / batchTime;
	}
} catch (_error: unknown) {
	// Handle batch verification error
}
try {
	KZG.verifyBlobKzgProofBatch(
		[blobs[0]],
		[commitments[0], commitments[1]], // Wrong length
		[proofs[0]],
	);
} catch (_error: unknown) {
	// Expected: mismatched array lengths
}
try {
	const wrongBlob = Bytes.zero(1000);
	KZG.verifyBlobKzgProofBatch([wrongBlob], [commitments[0]], [proofs[0]]);
} catch (_error: unknown) {
	// Expected: invalid blob size
}

KZG.freeTrustedSetup();
