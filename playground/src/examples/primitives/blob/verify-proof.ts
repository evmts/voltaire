import { Blob } from "@tevm/voltaire";
try {
	const data = new TextEncoder().encode("Data to verify with KZG proof");
	const blob = Blob.fromData(data);
	const commitment = Blob.toCommitment(blob);
	const proof = Blob.toProof(blob, commitment);
	const isValid = Blob.verify(blob, commitment, proof);
	// Create different blob with same commitment (should fail)
	const differentData = new TextEncoder().encode("Different data");
	const differentBlob = Blob.fromData(differentData);
	const invalidVerify = Blob.verify(differentBlob, commitment, proof);
	// Create multiple blobs with their commitments and proofs
	const blob1 = Blob.fromData(new TextEncoder().encode("Blob 1 data"));
	const blob2 = Blob.fromData(new TextEncoder().encode("Blob 2 data"));
	const blob3 = Blob.fromData(new TextEncoder().encode("Blob 3 data"));

	const commitment1 = Blob.toCommitment(blob1);
	const commitment2 = Blob.toCommitment(blob2);
	const commitment3 = Blob.toCommitment(blob3);

	const proof1 = Blob.toProof(blob1, commitment1);
	const proof2 = Blob.toProof(blob2, commitment2);
	const proof3 = Blob.toProof(blob3, commitment3);
	const batchValid = Blob.verifyBatch([
		{ blob: blob1, commitment: commitment1, proof: proof1 },
		{ blob: blob2, commitment: commitment2, proof: proof2 },
		{ blob: blob3, commitment: commitment3, proof: proof3 },
	]);
	const versionedHash = Blob.Commitment.toVersionedHash(commitment);
} catch (error) {
	console.error("KZG error:", error.message);
}
