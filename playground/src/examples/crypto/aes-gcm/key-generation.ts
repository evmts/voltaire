import * as AesGcm from "../../../crypto/AesGcm/index.js";

const key128 = await AesGcm.generateKey(128);
const key256 = await AesGcm.generateKey(256);

const exported128 = await AesGcm.exportKey(key128);
const exported256 = await AesGcm.exportKey(key256);

// Import from raw bytes
const keyMaterial = new Uint8Array(32);
crypto.getRandomValues(keyMaterial);

const imported = await AesGcm.importKey(keyMaterial);

// Verify round-trip
const reexported = await AesGcm.exportKey(imported);

const keyToStore = await AesGcm.generateKey(256);
const keyBytes = await AesGcm.exportKey(keyToStore);

// Common storage formats (for illustration only)
const hex = Array.from(keyBytes)
	.map((b) => b.toString(16).padStart(2, "0"))
	.join("");
const base64 = Buffer.from(keyBytes).toString("base64");

const keys = await Promise.all([
	AesGcm.generateKey(256),
	AesGcm.generateKey(256),
	AesGcm.generateKey(256),
]);

const exportedKeys = await Promise.all(keys.map((k) => AesGcm.exportKey(k)));

const sizes = [
	{ bits: 128, bytes: 16, desc: "AES-128 (standard)" },
	{ bits: 256, bytes: 32, desc: "AES-256 (recommended)" },
];
for (const size of sizes) {
}
