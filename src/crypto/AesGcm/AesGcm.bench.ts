/**
 * Benchmark: AES-GCM Authenticated Encryption
 * Compares performance of AES-GCM operations (WebCrypto-based)
 */

import { bench, run } from "mitata";
import { AesGcm } from "./index.js";

// Pre-generate keys for benchmarks
let key128: CryptoKey;
let key256: CryptoKey;

// Test data
const nonce = AesGcm.generateNonce();
const smallPlaintext = new Uint8Array(32).fill(0x42);
const mediumPlaintext = new Uint8Array(256).fill(0x43);
const largePlaintext = new Uint8Array(4096).fill(0x44);
const aad = new TextEncoder().encode("additional authenticated data");

// Pre-encrypted data for decryption benchmarks
let smallCiphertext128: Uint8Array;
let smallCiphertext256: Uint8Array;
let mediumCiphertext128: Uint8Array;
let mediumCiphertext256: Uint8Array;
let largeCiphertext128: Uint8Array;
let largeCiphertext256: Uint8Array;

// Initialize keys and ciphertexts
key128 = await AesGcm.generateKey(128);
key256 = await AesGcm.generateKey(256);

smallCiphertext128 = await AesGcm.encrypt(smallPlaintext, key128, nonce);
smallCiphertext256 = await AesGcm.encrypt(smallPlaintext, key256, nonce);
mediumCiphertext128 = await AesGcm.encrypt(mediumPlaintext, key128, nonce);
mediumCiphertext256 = await AesGcm.encrypt(mediumPlaintext, key256, nonce);
largeCiphertext128 = await AesGcm.encrypt(largePlaintext, key128, nonce);
largeCiphertext256 = await AesGcm.encrypt(largePlaintext, key256, nonce);

// ============================================================================
// Key Generation Benchmarks
// ============================================================================

bench("generateKey - 128-bit - Voltaire", async () => {
	await AesGcm.generateKey(128);
});

bench("generateKey - 256-bit - Voltaire", async () => {
	await AesGcm.generateKey(256);
});

await run();

bench("generateNonce - Voltaire", () => {
	AesGcm.generateNonce();
});

await run();

// ============================================================================
// Encryption Benchmarks - AES-128-GCM
// ============================================================================

bench("encrypt - 32B - AES-128-GCM - Voltaire", async () => {
	await AesGcm.encrypt(smallPlaintext, key128, nonce);
});

bench("encrypt - 256B - AES-128-GCM - Voltaire", async () => {
	await AesGcm.encrypt(mediumPlaintext, key128, nonce);
});

bench("encrypt - 4KB - AES-128-GCM - Voltaire", async () => {
	await AesGcm.encrypt(largePlaintext, key128, nonce);
});

await run();

// ============================================================================
// Encryption Benchmarks - AES-256-GCM
// ============================================================================

bench("encrypt - 32B - AES-256-GCM - Voltaire", async () => {
	await AesGcm.encrypt(smallPlaintext, key256, nonce);
});

bench("encrypt - 256B - AES-256-GCM - Voltaire", async () => {
	await AesGcm.encrypt(mediumPlaintext, key256, nonce);
});

bench("encrypt - 4KB - AES-256-GCM - Voltaire", async () => {
	await AesGcm.encrypt(largePlaintext, key256, nonce);
});

await run();

// ============================================================================
// Decryption Benchmarks - AES-128-GCM
// ============================================================================

bench("decrypt - 32B - AES-128-GCM - Voltaire", async () => {
	await AesGcm.decrypt(smallCiphertext128, key128, nonce);
});

bench("decrypt - 256B - AES-128-GCM - Voltaire", async () => {
	await AesGcm.decrypt(mediumCiphertext128, key128, nonce);
});

bench("decrypt - 4KB - AES-128-GCM - Voltaire", async () => {
	await AesGcm.decrypt(largeCiphertext128, key128, nonce);
});

await run();

// ============================================================================
// Decryption Benchmarks - AES-256-GCM
// ============================================================================

bench("decrypt - 32B - AES-256-GCM - Voltaire", async () => {
	await AesGcm.decrypt(smallCiphertext256, key256, nonce);
});

bench("decrypt - 256B - AES-256-GCM - Voltaire", async () => {
	await AesGcm.decrypt(mediumCiphertext256, key256, nonce);
});

bench("decrypt - 4KB - AES-256-GCM - Voltaire", async () => {
	await AesGcm.decrypt(largeCiphertext256, key256, nonce);
});

await run();

// ============================================================================
// With AAD (Additional Authenticated Data)
// ============================================================================

const ciphertextWithAad = await AesGcm.encrypt(
	smallPlaintext,
	key256,
	nonce,
	aad,
);

bench("encrypt - with AAD - AES-256-GCM - Voltaire", async () => {
	await AesGcm.encrypt(smallPlaintext, key256, nonce, aad);
});

bench("decrypt - with AAD - AES-256-GCM - Voltaire", async () => {
	await AesGcm.decrypt(ciphertextWithAad, key256, nonce, aad);
});

await run();

// ============================================================================
// Key Import/Export
// ============================================================================

const rawKey = new Uint8Array(32).fill(0x55);

bench("importKey - 256-bit - Voltaire", async () => {
	await AesGcm.importKey(rawKey, 256);
});

const importedKey = await AesGcm.importKey(rawKey, 256);

bench("exportKey - 256-bit - Voltaire", async () => {
	await AesGcm.exportKey(importedKey);
});

await run();

// ============================================================================
// Round-trip Benchmarks
// ============================================================================

bench("roundtrip - 32B - AES-256-GCM - Voltaire", async () => {
	const ct = await AesGcm.encrypt(smallPlaintext, key256, nonce);
	await AesGcm.decrypt(ct, key256, nonce);
});

bench("roundtrip - 256B - AES-256-GCM - Voltaire", async () => {
	const ct = await AesGcm.encrypt(mediumPlaintext, key256, nonce);
	await AesGcm.decrypt(ct, key256, nonce);
});

await run();
