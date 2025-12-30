/**
 * ChaCha20-Poly1305 Key Generation
 *
 * Keys must be:
 * - Exactly 32 bytes (256 bits)
 * - Cryptographically random
 * - Never reused across different applications
 * - Stored securely
 */
import { ChaCha20Poly1305 } from "@tevm/voltaire";

// Generate a random 256-bit key using the built-in function
const key = ChaCha20Poly1305.generateKey();
for (let i = 1; i <= 3; i++) {
	const newKey = ChaCha20Poly1305.generateKey();
}
const manualKey = new Uint8Array(ChaCha20Poly1305.KEY_SIZE);
// Fill with a pattern for demonstration (NOT secure for production!)
for (let i = 0; i < manualKey.length; i++) {
	manualKey[i] = i;
}

// Use the manual key for encryption
const nonce = ChaCha20Poly1305.generateNonce();
const plaintext = new TextEncoder().encode("Test with manual key");
const ciphertext = ChaCha20Poly1305.encrypt(plaintext, manualKey, nonce);
