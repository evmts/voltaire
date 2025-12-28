import { Blob, Bytes, Bytes32 } from "@tevm/voltaire";
const validData = new TextEncoder().encode("Valid blob data");
const validBlob = Blob.fromData(validData);
const emptyBlob = Blob(Bytes.zero(Blob.SIZE));
const tooSmall = Bytes.zero(1000);
const tooLarge = Bytes.zero(200000);
try {
	const blob = Blob.fromData(new TextEncoder().encode("Test"));
	const commitment = Blob.toCommitment(blob);
	const versionedHash = Blob.Commitment.toVersionedHash(commitment);

	// Invalid version
	const invalidHash = Bytes32.zero();
	invalidHash[0] = 0x99; // Wrong version
} catch (error) {}
const validCommitment = Bytes.zero(48);
const invalidCommitment = Bytes32.zero(); // Wrong size
const validProof = Bytes.zero(48);
const invalidProof = Bytes.zero(64); // Wrong size
const blob = Blob.fromData(new TextEncoder().encode("Check field elements"));

// Check first field element structure
const firstElement = blob.slice(0, Blob.BYTES_PER_FIELD_ELEMENT);
