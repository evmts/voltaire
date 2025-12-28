import { Blob, Bytes, Hex } from "@tevm/voltaire";

// === Creating Blobs ===
// Create empty blob
const emptyBlob = Blob(Bytes.zero(Blob.SIZE));

// Create blob from arbitrary data (auto-encoded)
const message = "Hello, EIP-4844! This is blob data for rollups.";
const data = new TextEncoder().encode(message);
const blob = Blob.fromData(data);

// === Extracting Data ===
const extracted = blob.toData();
const decoded = new TextDecoder().decode(extracted);

// === Gas Calculations ===
// EIP-4844 blob gas pricing
const singleBlobGas = Blob.calculateGas(1);
const threeBlobGas = Blob.calculateGas(3);
const maxBlobGas = Blob.calculateGas(Blob.MAX_PER_TRANSACTION);

// === Blob Versioned Hashes ===
// KZG commitment generates versioned hash (starts with 0x01)
// const commitment = Blob.toCommitment(blob);
// const versionedHash = Blob.toVersionedHash(commitment);
// console.log("Versioned hash prefix:", versionedHash[0]); // Should be 0x01

// === Data Capacity ===
// Useful bytes per blob (accounting for field element encoding)
// Each 32-byte field element has 1 byte overhead
const usableBytes = Math.floor((Blob.SIZE * 31) / 32);

// === Multiple Blobs ===
// Large data spanning multiple blobs
const largeData = Bytes.repeat(0xab, 200_000);
const blobsNeeded = Blob.estimateBlobCount(largeData.length);

// === Rollup Use Case ===
// Rollups batch transactions into blobs
const batchData = new TextEncoder().encode(
	JSON.stringify({
		transactions: [
			{ from: "0x123...", to: "0x456...", value: "1000000" },
			{ from: "0x789...", to: "0xabc...", value: "2000000" },
		],
		batchId: 12345,
	}),
);
const rollupBlob = Blob.fromData(batchData);
