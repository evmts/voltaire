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

console.log("=== ChaCha20-Poly1305 Nonce Management ===\n");

// Generate a random nonce
const randomNonce = ChaCha20Poly1305.generateNonce();
console.log("Random nonce generation:");
console.log(
	`  Length: ${randomNonce.length} bytes (${randomNonce.length * 8} bits)`,
);
console.log(`  Hex: ${Buffer.from(randomNonce).toString("hex")}`);
console.log(
	`  Matches NONCE_SIZE: ${randomNonce.length === ChaCha20Poly1305.NONCE_SIZE}`,
);

// Counter-based nonce approach
console.log("\n=== Counter-Based Nonce ===");
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

console.log("Counter nonces (sequential, never repeat):");
for (let i = 0; i < 3; i++) {
	const nonce = createCounterNonce();
	console.log(`  Nonce ${i}: ${Buffer.from(nonce).toString("hex")}`);
}

// Demonstrate nonce storage with ciphertext
console.log("\n=== Storing Nonce with Ciphertext ===");
const key = ChaCha20Poly1305.generateKey();
const nonce = ChaCha20Poly1305.generateNonce();
const plaintext = new TextEncoder().encode("Secret message");

const ciphertext = ChaCha20Poly1305.encrypt(plaintext, key, nonce);

// Combine nonce + ciphertext for storage/transmission
const combined = new Uint8Array(nonce.length + ciphertext.length);
combined.set(nonce, 0);
combined.set(ciphertext, nonce.length);

console.log(
	`Nonce (${nonce.length} bytes): ${Buffer.from(nonce).toString("hex")}`,
);
console.log(
	`Ciphertext (${ciphertext.length} bytes): ${Buffer.from(ciphertext).toString("hex")}`,
);
console.log(
	`Combined (${combined.length} bytes): ${Buffer.from(combined).toString("hex")}`,
);

// Extract and decrypt
const extractedNonce = combined.slice(0, ChaCha20Poly1305.NONCE_SIZE);
const extractedCiphertext = combined.slice(ChaCha20Poly1305.NONCE_SIZE);
const decrypted = ChaCha20Poly1305.decrypt(
	extractedCiphertext,
	key,
	extractedNonce,
);
console.log(`\nDecrypted: "${new TextDecoder().decode(decrypted)}"`);

// Nonce reuse detection (DO NOT do this in production!)
console.log("\n=== Why Nonce Reuse is Dangerous ===");
console.log("Reusing a nonce with the same key:");
console.log("1. Reveals XOR of two plaintexts");
console.log("2. Allows message forgery");
console.log("3. Completely breaks security guarantees");
console.log("\nPrevention strategies:");
console.log("- Random nonces: 2^48 messages before collision risk");
console.log("- Counter nonces: Unlimited messages, requires state tracking");
console.log("- Hybrid: Counter + random prefix for distributed systems");
