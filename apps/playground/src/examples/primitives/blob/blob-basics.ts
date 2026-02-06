import { Blob, Bytes } from "@tevm/voltaire";
// Create empty blob
const emptyBlob = Blob(Bytes.zero(Blob.SIZE));

// Create blob from data (auto-encoded with field element format)
const message = "Hello, EIP-4844! This is blob data.";
const data = new TextEncoder().encode(message);
const blob = Blob.fromData(data);

// Extract data back
const extracted = Blob.toData(blob);
const decoded = new TextDecoder().decode(extracted);

// Invalid blob (wrong size)
const invalid = Bytes.zero(1000);
const singleBlobGas = Blob.calculateGas(1);
const maxBlobsGas = Blob.calculateGas(Blob.MAX_PER_TRANSACTION);
const smallData = Bytes.zero(50000);
const largeData = Bytes.zero(200000);
