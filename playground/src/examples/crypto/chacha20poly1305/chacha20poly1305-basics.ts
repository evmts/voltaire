/**
 * ChaCha20-Poly1305 Basics - Overview of Authenticated Encryption
 *
 * ChaCha20-Poly1305 is an Authenticated Encryption with Associated Data (AEAD) cipher.
 * It combines ChaCha20 stream cipher for encryption with Poly1305 MAC for authentication.
 *
 * Key properties:
 * - 256-bit key (32 bytes)
 * - 96-bit nonce (12 bytes)
 * - 128-bit authentication tag (16 bytes)
 * - Software-optimized (no hardware AES needed)
 * - Defined in RFC 8439
 */
import { ChaCha20Poly1305 } from "@tevm/voltaire";

// Display constants
console.log("=== ChaCha20-Poly1305 Constants ===");
console.log(`Key size: ${ChaCha20Poly1305.KEY_SIZE} bytes (256 bits)`);
console.log(`Nonce size: ${ChaCha20Poly1305.NONCE_SIZE} bytes (96 bits)`);
console.log(`Tag size: ${ChaCha20Poly1305.TAG_SIZE} bytes (128 bits)`);

// Basic encrypt/decrypt flow
console.log("\n=== Basic Encrypt/Decrypt Flow ===");

// 1. Generate a key
const key = ChaCha20Poly1305.generateKey();
console.log(
	`Generated key (${key.length} bytes):`,
	Buffer.from(key).toString("hex"),
);

// 2. Generate a nonce (must be unique per message with same key)
const nonce = ChaCha20Poly1305.generateNonce();
console.log(
	`Generated nonce (${nonce.length} bytes):`,
	Buffer.from(nonce).toString("hex"),
);

// 3. Encrypt plaintext
const plaintext = new TextEncoder().encode("Hello, ChaCha20-Poly1305!");
console.log(`\nPlaintext: "${new TextDecoder().decode(plaintext)}"`);
console.log(`Plaintext length: ${plaintext.length} bytes`);

const ciphertext = ChaCha20Poly1305.encrypt(plaintext, key, nonce);
console.log(
	`\nCiphertext (${ciphertext.length} bytes):`,
	Buffer.from(ciphertext).toString("hex"),
);
console.log(
	`Ciphertext = encrypted data (${plaintext.length} bytes) + auth tag (${ChaCha20Poly1305.TAG_SIZE} bytes)`,
);

// 4. Decrypt ciphertext
const decrypted = ChaCha20Poly1305.decrypt(ciphertext, key, nonce);
console.log(`\nDecrypted: "${new TextDecoder().decode(decrypted)}"`);
console.log(
	`Decrypted matches original: ${new TextDecoder().decode(decrypted) === new TextDecoder().decode(plaintext)}`,
);

// Authenticated encryption guarantees
console.log("\n=== What Authenticated Encryption Provides ===");
console.log("1. Confidentiality: Ciphertext reveals nothing about plaintext");
console.log("2. Integrity: Any modification to ciphertext is detected");
console.log("3. Authenticity: Proves ciphertext was created by key holder");
