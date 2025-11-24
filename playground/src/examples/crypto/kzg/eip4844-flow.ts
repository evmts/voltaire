import { createHash } from "node:crypto";
import {
	BYTES_PER_BLOB,
	FIELD_ELEMENTS_PER_BLOB,
	KZG,
} from "../../../crypto/KZG/index.js";

// Example: Complete EIP-4844 blob transaction workflow

KZG.loadTrustedSetup();

// EIP-4844 allows up to 6 blobs per transaction
const MAX_BLOBS_PER_TX = 6;

interface BlobSidecar {
	blob: Uint8Array;
	commitment: Uint8Array;
	versionedHash: string;
}

const blobSidecars: BlobSidecar[] = [];

// Step 1: Create blobs and commitments
for (let i = 0; i < MAX_BLOBS_PER_TX; i++) {
	// Generate blob with L2 data
	const blob = KZG.generateRandomBlob();

	// Compute commitment
	const commitment = KZG.Commitment(blob);

	// Compute versioned hash (EIP-4844 spec)
	// versionedHash = sha256(VERSIONED_HASH_VERSION_KZG || commitment)
	const VERSIONED_HASH_VERSION_KZG = 0x01;
	const versionedHashInput = Buffer.concat([
		Buffer.from([VERSIONED_HASH_VERSION_KZG]),
		Buffer.from(commitment),
	]);
	const versionedHash = createHash("sha256")
		.update(versionedHashInput)
		.digest("hex");

	blobSidecars.push({ blob, commitment, versionedHash: `0x${versionedHash}` });
}
const z = new Uint8Array(32);
z[0] = 0;
z[31] = 0x42;

for (let i = 0; i < blobSidecars.length; i++) {
	const { blob, commitment } = blobSidecars[i];
	const { proof, y } = KZG.Proof(blob, z);

	// Verify proof
	const valid = KZG.verifyKzgProof(commitment, z, y, proof);
}
const totalBytes = BYTES_PER_BLOB * MAX_BLOBS_PER_TX;
const totalKB = totalBytes / 1024;

KZG.freeTrustedSetup();
