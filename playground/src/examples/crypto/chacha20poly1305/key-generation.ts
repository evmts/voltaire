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

console.log("=== ChaCha20-Poly1305 Key Generation ===\n");

// Generate a random 256-bit key using the built-in function
const key = ChaCha20Poly1305.generateKey();

console.log("Generated key:");
console.log(`  Length: ${key.length} bytes (${key.length * 8} bits)`);
console.log(`  Hex: ${Buffer.from(key).toString("hex")}`);
console.log(`  Base64: ${Buffer.from(key).toString("base64")}`);

// Verify key size matches constant
console.log(
	`\nKey size matches KEY_SIZE constant: ${key.length === ChaCha20Poly1305.KEY_SIZE}`,
);

// Generate multiple keys to show randomness
console.log("\n=== Multiple Key Generation ===");
for (let i = 1; i <= 3; i++) {
	const newKey = ChaCha20Poly1305.generateKey();
	console.log(
		`Key ${i}: ${Buffer.from(newKey).toString("hex").slice(0, 32)}...`,
	);
}

// Manual key creation (for testing or when deriving from password)
console.log("\n=== Manual Key Creation ===");
const manualKey = new Uint8Array(ChaCha20Poly1305.KEY_SIZE);
// Fill with a pattern for demonstration (NOT secure for production!)
for (let i = 0; i < manualKey.length; i++) {
	manualKey[i] = i;
}
console.log(`Manual key: ${Buffer.from(manualKey).toString("hex")}`);

// Use the manual key for encryption
const nonce = ChaCha20Poly1305.generateNonce();
const plaintext = new TextEncoder().encode("Test with manual key");
const ciphertext = ChaCha20Poly1305.encrypt(plaintext, manualKey, nonce);
console.log(`Encryption with manual key succeeded: ${ciphertext.length > 0}`);

// Key security best practices
console.log("\n=== Key Security Best Practices ===");
console.log("1. Always use generateKey() for production keys");
console.log("2. Never hardcode keys in source code");
console.log(
	"3. Use key derivation functions (HKDF, Argon2) for password-based keys",
);
console.log("4. Rotate keys periodically");
console.log("5. Securely delete keys when no longer needed");
