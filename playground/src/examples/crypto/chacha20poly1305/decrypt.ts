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

console.log("=== ChaCha20-Poly1305 Decryption ===\n");

// Setup - encrypt something first
const key = ChaCha20Poly1305.generateKey();
const nonce = ChaCha20Poly1305.generateNonce();
const originalMessage =
	"This is a secret message that will be encrypted and decrypted.";
const plaintext = new TextEncoder().encode(originalMessage);
const ciphertext = ChaCha20Poly1305.encrypt(plaintext, key, nonce);

console.log("=== Successful Decryption ===");
console.log(`Original: "${originalMessage}"`);
console.log(`Ciphertext: ${Buffer.from(ciphertext).toString("hex")}`);

const decrypted = ChaCha20Poly1305.decrypt(ciphertext, key, nonce);
const decryptedMessage = new TextDecoder().decode(decrypted);

console.log(`Decrypted: "${decryptedMessage}"`);
console.log(`Matches original: ${decryptedMessage === originalMessage}`);

// Decryption with wrong key
console.log("\n=== Decryption with Wrong Key ===");
const wrongKey = ChaCha20Poly1305.generateKey();
try {
	ChaCha20Poly1305.decrypt(ciphertext, wrongKey, nonce);
	console.log("ERROR: Should have thrown!");
} catch (error) {
	if (error instanceof DecryptionError) {
		console.log(`DecryptionError caught: ${error.message}`);
	} else {
		console.log(`Unexpected error: ${error}`);
	}
}

// Decryption with wrong nonce
console.log("\n=== Decryption with Wrong Nonce ===");
const wrongNonce = ChaCha20Poly1305.generateNonce();
try {
	ChaCha20Poly1305.decrypt(ciphertext, key, wrongNonce);
	console.log("ERROR: Should have thrown!");
} catch (error) {
	if (error instanceof DecryptionError) {
		console.log(`DecryptionError caught: ${error.message}`);
	} else {
		console.log(`Unexpected error: ${error}`);
	}
}

// Decryption of tampered ciphertext
console.log("\n=== Decryption of Tampered Ciphertext ===");
const tamperedCiphertext = new Uint8Array(ciphertext);
tamperedCiphertext[0] ^= 0xff; // Flip bits in first byte
try {
	ChaCha20Poly1305.decrypt(tamperedCiphertext, key, nonce);
	console.log("ERROR: Should have thrown!");
} catch (error) {
	if (error instanceof DecryptionError) {
		console.log(`DecryptionError caught: ${error.message}`);
		console.log("Tamper detection working correctly!");
	} else {
		console.log(`Unexpected error: ${error}`);
	}
}

// Decryption of truncated ciphertext
console.log("\n=== Decryption of Truncated Ciphertext ===");
const truncatedCiphertext = ciphertext.slice(0, 10); // Too short
try {
	ChaCha20Poly1305.decrypt(truncatedCiphertext, key, nonce);
	console.log("ERROR: Should have thrown!");
} catch (error) {
	if (error instanceof DecryptionError) {
		console.log(`DecryptionError caught: ${error.message}`);
	} else {
		console.log(`Unexpected error: ${error}`);
	}
}

// Decrypt binary data
console.log("\n=== Decrypting Binary Data ===");
const binaryData = new Uint8Array([0x00, 0x01, 0x02, 0xff, 0xfe, 0xfd]);
const nonce2 = ChaCha20Poly1305.generateNonce();
const encryptedBinary = ChaCha20Poly1305.encrypt(binaryData, key, nonce2);
const decryptedBinary = ChaCha20Poly1305.decrypt(encryptedBinary, key, nonce2);

console.log(`Original binary: [${Array.from(binaryData).join(", ")}]`);
console.log(`Decrypted binary: [${Array.from(decryptedBinary).join(", ")}]`);
console.log(`Match: ${binaryData.every((v, i) => v === decryptedBinary[i])}`);
