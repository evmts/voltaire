/**
 * ChaCha20-Poly1305 Encryption
 *
 * Encrypts plaintext and produces ciphertext with authentication tag.
 * The tag is automatically appended to the ciphertext.
 */
import { ChaCha20Poly1305 } from "@tevm/voltaire";

// Setup
const key = ChaCha20Poly1305.generateKey();
const nonce = ChaCha20Poly1305.generateNonce();
const message = "Hello, World! This is a secret message.";
const plaintext = new TextEncoder().encode(message);

const ciphertext = ChaCha20Poly1305.encrypt(plaintext, key, nonce);
const binaryData = new Uint8Array([0x00, 0x01, 0x02, 0xff, 0xfe, 0xfd]);
const nonce2 = ChaCha20Poly1305.generateNonce();

const encryptedBinary = ChaCha20Poly1305.encrypt(binaryData, key, nonce2);
const emptyData = new Uint8Array(0);
const nonce3 = ChaCha20Poly1305.generateNonce();

const encryptedEmpty = ChaCha20Poly1305.encrypt(emptyData, key, nonce3);
const largeData = new Uint8Array(1024 * 1024); // 1 MB
crypto.getRandomValues(largeData);
const nonce4 = ChaCha20Poly1305.generateNonce();

const startTime = performance.now();
const encryptedLarge = ChaCha20Poly1305.encrypt(largeData, key, nonce4);
const endTime = performance.now();
const sameMessage = new TextEncoder().encode("Same message");
for (let i = 0; i < 3; i++) {
	const newNonce = ChaCha20Poly1305.generateNonce();
	const encrypted = ChaCha20Poly1305.encrypt(sameMessage, key, newNonce);
}
