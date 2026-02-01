/**
 * Benchmark: ChaCha20-Poly1305 Authenticated Encryption
 * Compares performance of ChaCha20-Poly1305 operations
 */

import { chacha20poly1305 } from "@noble/ciphers/chacha.js";
import { bench, run } from "mitata";
import { ChaCha20Poly1305 } from "./index.js";

// Test data
const key = ChaCha20Poly1305.generateKey();
const nonce = ChaCha20Poly1305.generateNonce();
const smallPlaintext = new Uint8Array(32).fill(0x42);
const mediumPlaintext = new Uint8Array(256).fill(0x43);
const largePlaintext = new Uint8Array(4096).fill(0x44);
const xlargePlaintext = new Uint8Array(65536).fill(0x45); // 64KB
const aad = new TextEncoder().encode("additional authenticated data");

// Pre-encrypted data for decryption benchmarks
const smallCiphertext = ChaCha20Poly1305.encrypt(smallPlaintext, key, nonce);
const mediumCiphertext = ChaCha20Poly1305.encrypt(mediumPlaintext, key, nonce);
const largeCiphertext = ChaCha20Poly1305.encrypt(largePlaintext, key, nonce);
const xlargeCiphertext = ChaCha20Poly1305.encrypt(xlargePlaintext, key, nonce);

// Noble cipher for comparison
const nobleCipher = chacha20poly1305(key, nonce);
const nobleSmallCiphertext = nobleCipher.encrypt(smallPlaintext);
const nobleMediumCiphertext = chacha20poly1305(key, nonce).encrypt(
	mediumPlaintext,
);
const nobleLargeCiphertext = chacha20poly1305(key, nonce).encrypt(
	largePlaintext,
);

// ============================================================================
// Key Generation Benchmarks
// ============================================================================

bench("generateKey - Voltaire", () => {
	ChaCha20Poly1305.generateKey();
});

await run();

bench("generateNonce - Voltaire", () => {
	ChaCha20Poly1305.generateNonce();
});

await run();

// ============================================================================
// Encryption Benchmarks - Voltaire
// ============================================================================

bench("encrypt - 32B - Voltaire", () => {
	ChaCha20Poly1305.encrypt(smallPlaintext, key, nonce);
});

bench("encrypt - 32B - Noble", () => {
	chacha20poly1305(key, nonce).encrypt(smallPlaintext);
});

await run();

bench("encrypt - 256B - Voltaire", () => {
	ChaCha20Poly1305.encrypt(mediumPlaintext, key, nonce);
});

bench("encrypt - 256B - Noble", () => {
	chacha20poly1305(key, nonce).encrypt(mediumPlaintext);
});

await run();

bench("encrypt - 4KB - Voltaire", () => {
	ChaCha20Poly1305.encrypt(largePlaintext, key, nonce);
});

bench("encrypt - 4KB - Noble", () => {
	chacha20poly1305(key, nonce).encrypt(largePlaintext);
});

await run();

bench("encrypt - 64KB - Voltaire", () => {
	ChaCha20Poly1305.encrypt(xlargePlaintext, key, nonce);
});

bench("encrypt - 64KB - Noble", () => {
	chacha20poly1305(key, nonce).encrypt(xlargePlaintext);
});

await run();

// ============================================================================
// Decryption Benchmarks
// ============================================================================

bench("decrypt - 32B - Voltaire", () => {
	ChaCha20Poly1305.decrypt(smallCiphertext, key, nonce);
});

bench("decrypt - 32B - Noble", () => {
	chacha20poly1305(key, nonce).decrypt(nobleSmallCiphertext);
});

await run();

bench("decrypt - 256B - Voltaire", () => {
	ChaCha20Poly1305.decrypt(mediumCiphertext, key, nonce);
});

bench("decrypt - 256B - Noble", () => {
	chacha20poly1305(key, nonce).decrypt(nobleMediumCiphertext);
});

await run();

bench("decrypt - 4KB - Voltaire", () => {
	ChaCha20Poly1305.decrypt(largeCiphertext, key, nonce);
});

bench("decrypt - 4KB - Noble", () => {
	chacha20poly1305(key, nonce).decrypt(nobleLargeCiphertext);
});

await run();

bench("decrypt - 64KB - Voltaire", () => {
	ChaCha20Poly1305.decrypt(xlargeCiphertext, key, nonce);
});

await run();

// ============================================================================
// With AAD (Additional Authenticated Data)
// ============================================================================

const ciphertextWithAad = ChaCha20Poly1305.encrypt(
	smallPlaintext,
	key,
	nonce,
	aad,
);

bench("encrypt - with AAD - Voltaire", () => {
	ChaCha20Poly1305.encrypt(smallPlaintext, key, nonce, aad);
});

bench("encrypt - with AAD - Noble", () => {
	chacha20poly1305(key, nonce, aad).encrypt(smallPlaintext);
});

await run();

bench("decrypt - with AAD - Voltaire", () => {
	ChaCha20Poly1305.decrypt(ciphertextWithAad, key, nonce, aad);
});

await run();

// ============================================================================
// Round-trip Benchmarks
// ============================================================================

bench("roundtrip - 32B - Voltaire", () => {
	const ct = ChaCha20Poly1305.encrypt(smallPlaintext, key, nonce);
	ChaCha20Poly1305.decrypt(ct, key, nonce);
});

bench("roundtrip - 32B - Noble", () => {
	const ct = chacha20poly1305(key, nonce).encrypt(smallPlaintext);
	chacha20poly1305(key, nonce).decrypt(ct);
});

await run();

bench("roundtrip - 4KB - Voltaire", () => {
	const ct = ChaCha20Poly1305.encrypt(largePlaintext, key, nonce);
	ChaCha20Poly1305.decrypt(ct, key, nonce);
});

bench("roundtrip - 4KB - Noble", () => {
	const ct = chacha20poly1305(key, nonce).encrypt(largePlaintext);
	chacha20poly1305(key, nonce).decrypt(ct);
});

await run();
