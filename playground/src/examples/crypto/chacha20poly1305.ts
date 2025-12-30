import { ChaCha20Poly1305, Hex } from "@tevm/voltaire";

// ChaCha20-Poly1305 - Authenticated Encryption (RFC 8439)

// === Key Generation ===
// Generate a random 256-bit (32-byte) key
const key = ChaCha20Poly1305.generateKey();
console.log("Generated key:", Hex.fromBytes(key).slice(0, 20) + "...");
console.log("Key size:", ChaCha20Poly1305.KEY_SIZE, "bytes");

// === Nonce Generation ===
// Generate a random 96-bit (12-byte) nonce
const nonce = ChaCha20Poly1305.generateNonce();
console.log("\nGenerated nonce:", Hex.fromBytes(nonce));
console.log("Nonce size:", ChaCha20Poly1305.NONCE_SIZE, "bytes");

// === Encryption ===
// Encrypt plaintext with authenticated encryption
const plaintext = new TextEncoder().encode("Hello, ChaCha20-Poly1305!");
console.log("\nOriginal:", new TextDecoder().decode(plaintext));

const ciphertext = ChaCha20Poly1305.encrypt(plaintext, key, nonce);
console.log("Ciphertext:", Hex.fromBytes(ciphertext));
console.log(
	"Ciphertext length:",
	ciphertext.length,
	"(plaintext + 16-byte tag)",
);

// === Decryption ===
// Decrypt and verify authentication tag
const decrypted = ChaCha20Poly1305.decrypt(ciphertext, key, nonce);
console.log("\nDecrypted:", new TextDecoder().decode(decrypted));

// === Associated Data (AAD) ===
// You can include additional data that's authenticated but not encrypted
const message = new TextEncoder().encode("Secret message");
const aad = new TextEncoder().encode("metadata:v1");

const ciphertextWithAad = ChaCha20Poly1305.encrypt(message, key, nonce, aad);
console.log("\nEncrypted with AAD:", Hex.fromBytes(ciphertextWithAad));

const decryptedWithAad = ChaCha20Poly1305.decrypt(
	ciphertextWithAad,
	key,
	nonce,
	aad,
);
console.log("Decrypted with AAD:", new TextDecoder().decode(decryptedWithAad));

// === Tamper Detection ===
// Modifying ciphertext will cause decryption to fail
const tamperedCiphertext = new Uint8Array(ciphertext);
tamperedCiphertext[0] ^= 0xff; // Flip bits

try {
	ChaCha20Poly1305.decrypt(tamperedCiphertext, key, nonce);
	console.log("\nTampered decryption: succeeded (unexpected!)");
} catch (e) {
	console.log("\nTampered decryption: failed (authentication tag invalid)");
}

// === Why ChaCha20-Poly1305? ===
// - Faster than AES-GCM on devices without AES hardware
// - No timing attacks (constant-time operations)
// - Used in TLS 1.3, WireGuard, SSH
// - Tag size: 16 bytes (Poly1305 MAC)

console.log("\nChaCha20-Poly1305 constants:");
console.log("  Key size:", ChaCha20Poly1305.KEY_SIZE, "bytes (256 bits)");
console.log("  Nonce size:", ChaCha20Poly1305.NONCE_SIZE, "bytes (96 bits)");
console.log("  Tag size:", ChaCha20Poly1305.TAG_SIZE, "bytes (128 bits)");

// === Multiple Messages with Same Key ===
// IMPORTANT: Never reuse nonce with same key!
const nonce1 = ChaCha20Poly1305.generateNonce();
const nonce2 = ChaCha20Poly1305.generateNonce();

const msg1 = new TextEncoder().encode("First message");
const msg2 = new TextEncoder().encode("Second message");

const ct1 = ChaCha20Poly1305.encrypt(msg1, key, nonce1);
const ct2 = ChaCha20Poly1305.encrypt(msg2, key, nonce2);

console.log("\nMultiple messages with different nonces:");
console.log("  Message 1:", new TextDecoder().decode(msg1));
console.log("  Message 2:", new TextDecoder().decode(msg2));
console.log("  Nonces are unique:", Hex.fromBytes(nonce1) !== Hex.fromBytes(nonce2));
