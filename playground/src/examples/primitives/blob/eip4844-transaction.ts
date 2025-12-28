import { Blob } from "voltaire";
const applicationData = JSON.stringify({
	type: "rollup_batch",
	transactions: [
		{ from: "0x123...", to: "0x456...", value: "1000000000000000000" },
		{ from: "0x789...", to: "0xabc...", value: "2000000000000000000" },
		{ from: "0xdef...", to: "0x012...", value: "3000000000000000000" },
	],
	stateRoot:
		"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
	blockNumber: 12345,
});

const data = new TextEncoder().encode(applicationData);
const blobCount = Blob.estimateBlobCount(data.length);

const blobs = Blob.splitData(data);
try {
	const commitments = blobs.map((blob) => Blob.toCommitment(blob));
	const versionedHashes = commitments.map((c) =>
		Blob.Commitment.toVersionedHash(c),
	);

	for (let i = 0; i < versionedHashes.length; i++) {
		const hash = versionedHashes[i];
	}
	const proofs = blobs.map((blob, i) => Blob.toProof(blob, commitments[i]));
	const verifications = blobs.map((blob, i) =>
		Blob.verify(blob, commitments[i], proofs[i]),
	);
	const blobGas = Blob.calculateGas(blobs.length);
	const recovered = Blob.joinData(blobs);
	const recoveredJson = new TextDecoder().decode(recovered);
	const recoveredData = JSON.parse(recoveredJson);
} catch (error) {
	console.error("\nKZG error:", error.message);
}
