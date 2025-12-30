/**
 * ChaCha20-Poly1305 Decryption
 *
 * Decrypts ciphertext and verifies the authentication tag.
 * Decryption will fail if:
 * - Wrong key is used
 * - Wrong nonce is used
 * - Ciphertext has been tampered with
 */
import { ChaCha20Poly1305, DecryptionError } from "@tevm/voltaire";

// Setup - encrypt something first
const key = ChaCha20Poly1305.generateKey();
const nonce = ChaCha20Poly1305.generateNonce();
const originalMessage =
	"This is a secret message that will be encrypted and decrypted.";
const plaintext = new TextEncoder().encode(originalMessage);
const ciphertext = ChaCha20Poly1305.encrypt(plaintext, key, nonce);

const decrypted = ChaCha20Poly1305.decrypt(ciphertext, key, nonce);
const decryptedMessage = new TextDecoder().decode(decrypted);
const wrongKey = ChaCha20Poly1305.generateKey();
try {
	ChaCha20Poly1305.decrypt(ciphertext, wrongKey, nonce);
} catch (error) {
	if (error instanceof DecryptionError) {
	} else {
	}
}
const wrongNonce = ChaCha20Poly1305.generateNonce();
try {
	ChaCha20Poly1305.decrypt(ciphertext, key, wrongNonce);
} catch (error) {
	if (error instanceof DecryptionError) {
	} else {
	}
}
const tamperedCiphertext = new Uint8Array(ciphertext);
tamperedCiphertext[0] ^= 0xff; // Flip bits in first byte
try {
	ChaCha20Poly1305.decrypt(tamperedCiphertext, key, nonce);
} catch (error) {
	if (error instanceof DecryptionError) {
	} else {
	}
}
const truncatedCiphertext = ciphertext.slice(0, 10); // Too short
try {
	ChaCha20Poly1305.decrypt(truncatedCiphertext, key, nonce);
} catch (error) {
	if (error instanceof DecryptionError) {
	} else {
	}
}
const binaryData = new Uint8Array([0x00, 0x01, 0x02, 0xff, 0xfe, 0xfd]);
const nonce2 = ChaCha20Poly1305.generateNonce();
const encryptedBinary = ChaCha20Poly1305.encrypt(binaryData, key, nonce2);
const decryptedBinary = ChaCha20Poly1305.decrypt(encryptedBinary, key, nonce2);
