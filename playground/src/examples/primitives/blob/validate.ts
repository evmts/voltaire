import * as Blob from "../../../primitives/Blob/index.js";
const validData = new TextEncoder().encode("Valid blob data");
const validBlob = Blob.fromData(validData);
const emptyBlob = Blob.from(new Uint8Array(Blob.SIZE));
const tooSmall = new Uint8Array(1000);
const tooLarge = new Uint8Array(200000);
try {
	const blob = Blob.fromData(new TextEncoder().encode("Test"));
	const commitment = Blob.toCommitment(blob);
	const versionedHash = Blob.Commitment.toVersionedHash(commitment);

	// Invalid version
	const invalidHash = new Uint8Array(32);
	invalidHash[0] = 0x99; // Wrong version
} catch (error) {}
const validCommitment = new Uint8Array(48);
const invalidCommitment = new Uint8Array(32); // Wrong size
const validProof = new Uint8Array(48);
const invalidProof = new Uint8Array(64); // Wrong size
const blob = Blob.fromData(new TextEncoder().encode("Check field elements"));

// Check first field element structure
const firstElement = blob.slice(0, Blob.BYTES_PER_FIELD_ELEMENT);
