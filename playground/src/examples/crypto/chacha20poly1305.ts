import { ChaCha20Poly1305, Hex } from "@tevm/voltaire";

// ChaCha20-Poly1305 - Authenticated Encryption (RFC 8439)

// === Key Generation ===
// Generate a random 256-bit (32-byte) key
const key = ChaCha20Poly1305.generateKey();

// === Nonce Generation ===
// Generate a random 96-bit (12-byte) nonce
const nonce = ChaCha20Poly1305.generateNonce();

// === Encryption ===
// Encrypt plaintext with authenticated encryption
const plaintext = new TextEncoder().encode("Hello, ChaCha20-Poly1305!");

const ciphertext = ChaCha20Poly1305.encrypt(plaintext, key, nonce);

// === Decryption ===
// Decrypt and verify authentication tag
const decrypted = ChaCha20Poly1305.decrypt(ciphertext, key, nonce);

// === Associated Data (AAD) ===
// You can include additional data that's authenticated but not encrypted
const message = new TextEncoder().encode("Secret message");
const aad = new TextEncoder().encode("metadata:v1");

const ciphertextWithAad = ChaCha20Poly1305.encrypt(message, key, nonce, aad);

const decryptedWithAad = ChaCha20Poly1305.decrypt(
	ciphertextWithAad,
	key,
	nonce,
	aad,
);

// === Tamper Detection ===
// Modifying ciphertext will cause decryption to fail
const tamperedCiphertext = new Uint8Array(ciphertext);
tamperedCiphertext[0] ^= 0xff; // Flip bits

try {
	ChaCha20Poly1305.decrypt(tamperedCiphertext, key, nonce);
} catch (e) {}

// === Multiple Messages with Same Key ===
// IMPORTANT: Never reuse nonce with same key!
const nonce1 = ChaCha20Poly1305.generateNonce();
const nonce2 = ChaCha20Poly1305.generateNonce();

const msg1 = new TextEncoder().encode("First message");
const msg2 = new TextEncoder().encode("Second message");

const ct1 = ChaCha20Poly1305.encrypt(msg1, key, nonce1);
const ct2 = ChaCha20Poly1305.encrypt(msg2, key, nonce2);
