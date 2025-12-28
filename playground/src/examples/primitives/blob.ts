import { Blob, Hex, Bytes } from "@tevm/voltaire";

// === Blob Basics ===
// Blob size: 128KB (131072 bytes, 4096 field elements of 32 bytes)
console.log("Blob size:", Blob.SIZE, "bytes");
console.log("Max blobs per tx:", Blob.MAX_PER_TRANSACTION);

// === Creating Blobs ===
// Create empty blob
const emptyBlob = Blob(Bytes.zero(Blob.SIZE));
console.log("Empty blob created, length:", emptyBlob.length);

// Create blob from arbitrary data (auto-encoded)
const message = "Hello, EIP-4844! This is blob data for rollups.";
const data = new TextEncoder().encode(message);
const blob = Blob.fromData(data);
console.log("Data blob created from:", message.length, "bytes");

// === Extracting Data ===
const extracted = Blob.toData(blob);
const decoded = new TextDecoder().decode(extracted);
console.log("Extracted data:", decoded);

// === Gas Calculations ===
// EIP-4844 blob gas pricing
const singleBlobGas = Blob.calculateGas(1);
const threeBlobGas = Blob.calculateGas(3);
const maxBlobGas = Blob.calculateGas(Blob.MAX_PER_TRANSACTION);

console.log("Gas for 1 blob:", singleBlobGas);
console.log("Gas for 3 blobs:", threeBlobGas);
console.log("Gas for max blobs:", maxBlobGas);

// === Blob Versioned Hashes ===
// KZG commitment generates versioned hash (starts with 0x01)
// const commitment = Blob.toCommitment(blob);
// const versionedHash = Blob.toVersionedHash(commitment);
// console.log("Versioned hash prefix:", versionedHash[0]); // Should be 0x01

// === Data Capacity ===
// Useful bytes per blob (accounting for field element encoding)
// Each 32-byte field element has 1 byte overhead
const usableBytes = Math.floor(Blob.SIZE * 31 / 32);
console.log("Usable bytes per blob:", usableBytes);

// === Multiple Blobs ===
// Large data spanning multiple blobs
const largeData = Bytes.repeat(0xab, 200_000);
const blobsNeeded = Blob.estimateBlobCount(largeData.length);
console.log("Blobs needed for 200KB:", blobsNeeded);

// === Rollup Use Case ===
// Rollups batch transactions into blobs
const batchData = new TextEncoder().encode(JSON.stringify({
  transactions: [
    { from: "0x123...", to: "0x456...", value: "1000000" },
    { from: "0x789...", to: "0xabc...", value: "2000000" }
  ],
  batchId: 12345
}));
const rollupBlob = Blob.fromData(batchData);
console.log("Rollup batch blob size:", rollupBlob.length);

// === Validation ===
console.log("Is valid blob size:", Blob.isValid(emptyBlob));
console.log("Is valid (wrong size):", Blob.isValid(Bytes.zero(1000)));
