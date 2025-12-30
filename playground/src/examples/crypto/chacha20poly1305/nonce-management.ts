/**
 * ChaCha20-Poly1305 Nonce Management
 *
 * Nonces (Number used ONCE) are critical for security:
 * - Must be exactly 12 bytes (96 bits)
 * - Must NEVER be reused with the same key
 * - Can be random or counter-based
 * - Do not need to be secret (can be sent with ciphertext)
 */
import { ChaCha20Poly1305 } from "@tevm/voltaire";

// Generate a random nonce
const randomNonce = ChaCha20Poly1305.generateNonce();
let counter = 0n;
function createCounterNonce(): Uint8Array {
	const nonce = new Uint8Array(ChaCha20Poly1305.NONCE_SIZE);
	// Store counter as little-endian in nonce
	let c = counter++;
	for (let i = 0; i < 8; i++) {
		nonce[i] = Number(c & 0xffn);
		c >>= 8n;
	}
	return nonce;
}
for (let i = 0; i < 3; i++) {
	const nonce = createCounterNonce();
}
const key = ChaCha20Poly1305.generateKey();
const nonce = ChaCha20Poly1305.generateNonce();
const plaintext = new TextEncoder().encode("Secret message");

const ciphertext = ChaCha20Poly1305.encrypt(plaintext, key, nonce);

// Combine nonce + ciphertext for storage/transmission
const combined = new Uint8Array(nonce.length + ciphertext.length);
combined.set(nonce, 0);
combined.set(ciphertext, nonce.length);

// Extract and decrypt
const extractedNonce = combined.slice(0, ChaCha20Poly1305.NONCE_SIZE);
const extractedCiphertext = combined.slice(ChaCha20Poly1305.NONCE_SIZE);
const decrypted = ChaCha20Poly1305.decrypt(
	extractedCiphertext,
	key,
	extractedNonce,
);
