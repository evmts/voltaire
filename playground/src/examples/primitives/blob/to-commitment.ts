import * as Blob from "../../../primitives/Blob/index.js";

// Create blob with some data
const data = new TextEncoder().encode(
	"This blob will generate a KZG commitment",
);
const blob = Blob.fromData(data);
try {
	const commitment = Blob.toCommitment(blob);
	const versionedHash = Blob.Commitment.toVersionedHash(commitment);
	const directHash = Blob.toVersionedHash(blob);
	const blob1 = Blob.fromData(new TextEncoder().encode("Blob 1"));
	const blob2 = Blob.fromData(new TextEncoder().encode("Blob 2"));
	const blob3 = Blob.fromData(new TextEncoder().encode("Blob 3"));

	const commitment1 = Blob.toCommitment(blob1);
	const commitment2 = Blob.toCommitment(blob2);
	const commitment3 = Blob.toCommitment(blob3);

	const hash1 = Blob.Commitment.toVersionedHash(commitment1);
	const hash2 = Blob.Commitment.toVersionedHash(commitment2);
	const hash3 = Blob.Commitment.toVersionedHash(commitment3);
} catch (error) {
	console.error("KZG error:", error.message);
}
