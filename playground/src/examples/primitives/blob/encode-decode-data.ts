import * as Blob from "../../../primitives/Blob/index.js";
const text = "Hello, EIP-4844! Blobs enable cheap data availability.";
const textBytes = new TextEncoder().encode(text);

const blob = Blob.fromData(textBytes);
const decoded = Blob.toData(blob);
const decodedText = new TextDecoder().decode(decoded);
const binary = new Uint8Array([0x01, 0x02, 0x03, 0xff, 0xfe, 0xfd]);

const binaryBlob = Blob.fromData(binary);
const decodedBinary = Blob.toData(binaryBlob);
const obj = {
	type: "blob_transaction",
	version: 1,
	timestamp: Date.now(),
	data: "Important payload",
};
const json = JSON.stringify(obj);
const jsonBytes = new TextEncoder().encode(json);

const jsonBlob = Blob.fromData(jsonBytes);
const decodedJson = Blob.toData(jsonBlob);
const decodedObj = JSON.parse(new TextDecoder().decode(decodedJson));
const largeData = new Uint8Array(50000);
largeData.fill(0x42);
const largeBlob = Blob.fromData(largeData);
const decodedLarge = Blob.toData(largeBlob);
