/**
 * Basic AES-GCM Usage
 *
 * Demonstrates:
 * - Key generation (128-bit and 256-bit)
 * - Nonce generation
 * - Basic encryption and decryption
 * - Authenticated encryption properties
 * - Deterministic behavior
 */

import * as AesGcm from "../../../src/crypto/AesGcm/index.js";

console.log("=== Basic AES-GCM Usage ===\n");

// 1. Generate 256-bit key (recommended)
console.log("1. Key Generation");
console.log("-".repeat(40));

const key256 = await AesGcm.generateKey(256);
console.log("Generated 256-bit key (AES-256-GCM)");

const key128 = await AesGcm.generateKey(128);
console.log("Generated 128-bit key (AES-128-GCM)\n");

// 2. Encrypt and decrypt
console.log("2. Basic Encryption and Decryption");
console.log("-".repeat(40));

const message = "Secret message for encryption";
const plaintext = new TextEncoder().encode(message);

// Generate nonce (must be unique per encryption)
const nonce = AesGcm.generateNonce();
console.log(`Message: "${message}"`);
console.log(`Plaintext length: ${plaintext.length} bytes`);
console.log(
	`Nonce: ${Buffer.from(nonce).toString("hex")} (${nonce.length} bytes)`,
);

// Encrypt
const ciphertext = await AesGcm.encrypt(plaintext, key256, nonce);
console.log(
	`Ciphertext length: ${ciphertext.length} bytes (includes 16-byte auth tag)`,
);
console.log(`Ciphertext: ${Buffer.from(ciphertext).toString("hex")}\n`);

// Decrypt
const decrypted = await AesGcm.decrypt(ciphertext, key256, nonce);
const decryptedMessage = new TextDecoder().decode(decrypted);
console.log(`Decrypted: "${decryptedMessage}"`);
console.log(`Match: ${decryptedMessage === message}\n`);

// 3. Authentication tag verification
console.log("3. Authentication Tag Verification");
console.log("-".repeat(40));

console.log("Tampering detection:");

// Tamper with ciphertext
const tamperedCiphertext = new Uint8Array(ciphertext);
tamperedCiphertext[0] ^= 0xff; // Flip bits in first byte

try {
	await AesGcm.decrypt(tamperedCiphertext, key256, nonce);
	console.log("❌ Tampering not detected (UNEXPECTED)");
} catch (error) {
	console.log("✓ Tampering detected and rejected");
}

// Wrong key
const wrongKey = await AesGcm.generateKey(256);
try {
	await AesGcm.decrypt(ciphertext, wrongKey, nonce);
	console.log("❌ Wrong key accepted (UNEXPECTED)");
} catch (error) {
	console.log("✓ Wrong key rejected");
}

// Wrong nonce
const wrongNonce = AesGcm.generateNonce();
try {
	await AesGcm.decrypt(ciphertext, key256, wrongNonce);
	console.log("❌ Wrong nonce accepted (UNEXPECTED)");
} catch (error) {
	console.log("✓ Wrong nonce rejected\n");
}

// 4. Different message sizes
console.log("4. Variable Message Sizes");
console.log("-".repeat(40));

const messages = ["", "Hi", "Hello, World!", "A".repeat(1000)];

for (const msg of messages) {
	const msgBytes = new TextEncoder().encode(msg);
	const msgNonce = AesGcm.generateNonce();
	const msgCt = await AesGcm.encrypt(msgBytes, key256, msgNonce);
	const msgDec = await AesGcm.decrypt(msgCt, key256, msgNonce);

	console.log(
		`Length ${msgBytes.length.toString().padStart(4)}: encrypted to ${msgCt.length} bytes (overhead: ${msgCt.length - msgBytes.length} bytes)`,
	);
}
console.log();

// 5. Deterministic encryption (same plaintext + key + nonce = same ciphertext)
console.log("5. Deterministic Behavior");
console.log("-".repeat(40));

const testMsg = new TextEncoder().encode("Test message");
const testKey = await AesGcm.generateKey(256);
const testNonce = AesGcm.generateNonce();

const ct1 = await AesGcm.encrypt(testMsg, testKey, testNonce);
const ct2 = await AesGcm.encrypt(testMsg, testKey, testNonce);
const ct3 = await AesGcm.encrypt(testMsg, testKey, testNonce);

const allMatch =
	Buffer.from(ct1).toString("hex") === Buffer.from(ct2).toString("hex") &&
	Buffer.from(ct2).toString("hex") === Buffer.from(ct3).toString("hex");

console.log("Same plaintext + key + nonce produces:");
console.log(
	`Ciphertext 1: ${Buffer.from(ct1).toString("hex").slice(0, 40)}...`,
);
console.log(
	`Ciphertext 2: ${Buffer.from(ct2).toString("hex").slice(0, 40)}...`,
);
console.log(
	`Ciphertext 3: ${Buffer.from(ct3).toString("hex").slice(0, 40)}...`,
);
console.log(`All identical: ${allMatch}\n`);

// 6. Constants
console.log("6. AES-GCM Constants");
console.log("-".repeat(40));

console.log(`AES-128 key size: ${AesGcm.AES128_KEY_SIZE} bytes`);
console.log(`AES-256 key size: ${AesGcm.AES256_KEY_SIZE} bytes`);
console.log(`Nonce size: ${AesGcm.NONCE_SIZE} bytes`);
console.log(`Authentication tag size: ${AesGcm.TAG_SIZE} bytes\n`);

console.log("=== Complete ===");
