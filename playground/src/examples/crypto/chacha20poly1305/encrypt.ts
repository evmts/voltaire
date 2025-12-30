/**
 * ChaCha20-Poly1305 Encryption
 *
 * Encrypts plaintext and produces ciphertext with authentication tag.
 * The tag is automatically appended to the ciphertext.
 */
import { ChaCha20Poly1305 } from "@tevm/voltaire";

console.log("=== ChaCha20-Poly1305 Encryption ===\n");

// Setup
const key = ChaCha20Poly1305.generateKey();
const nonce = ChaCha20Poly1305.generateNonce();

// Encrypt a string message
console.log("=== Encrypting String Data ===");
const message = "Hello, World! This is a secret message.";
const plaintext = new TextEncoder().encode(message);

console.log(`Original message: "${message}"`);
console.log(`Plaintext bytes: ${plaintext.length}`);

const ciphertext = ChaCha20Poly1305.encrypt(plaintext, key, nonce);

console.log(`\nCiphertext: ${Buffer.from(ciphertext).toString("hex")}`);
console.log(`Ciphertext length: ${ciphertext.length} bytes`);
console.log(
	`Overhead: ${ciphertext.length - plaintext.length} bytes (auth tag)`,
);

// Encrypt binary data
console.log("\n=== Encrypting Binary Data ===");
const binaryData = new Uint8Array([0x00, 0x01, 0x02, 0xff, 0xfe, 0xfd]);
const nonce2 = ChaCha20Poly1305.generateNonce();

console.log(
	`Binary data: [${Array.from(binaryData)
		.map((b) => `0x${b.toString(16).padStart(2, "0")}`)
		.join(", ")}]`,
);

const encryptedBinary = ChaCha20Poly1305.encrypt(binaryData, key, nonce2);
console.log(`Encrypted: ${Buffer.from(encryptedBinary).toString("hex")}`);

// Encrypt empty message
console.log("\n=== Encrypting Empty Data ===");
const emptyData = new Uint8Array(0);
const nonce3 = ChaCha20Poly1305.generateNonce();

const encryptedEmpty = ChaCha20Poly1305.encrypt(emptyData, key, nonce3);
console.log(`Empty plaintext length: ${emptyData.length}`);
console.log(
	`Encrypted empty length: ${encryptedEmpty.length} bytes (just the auth tag)`,
);

// Encrypt large data
console.log("\n=== Encrypting Large Data ===");
const largeData = new Uint8Array(1024 * 1024); // 1 MB
crypto.getRandomValues(largeData);
const nonce4 = ChaCha20Poly1305.generateNonce();

const startTime = performance.now();
const encryptedLarge = ChaCha20Poly1305.encrypt(largeData, key, nonce4);
const endTime = performance.now();

console.log(`Large data size: ${largeData.length / 1024} KB`);
console.log(`Encrypted size: ${encryptedLarge.length / 1024} KB`);
console.log(`Encryption time: ${(endTime - startTime).toFixed(2)} ms`);
console.log(
	`Throughput: ${(largeData.length / 1024 / 1024 / ((endTime - startTime) / 1000)).toFixed(2)} MB/s`,
);

// Demonstrate that same plaintext produces different ciphertext with different nonce
console.log("\n=== Same Plaintext, Different Nonces ===");
const sameMessage = new TextEncoder().encode("Same message");
for (let i = 0; i < 3; i++) {
	const newNonce = ChaCha20Poly1305.generateNonce();
	const encrypted = ChaCha20Poly1305.encrypt(sameMessage, key, newNonce);
	console.log(
		`Encryption ${i + 1}: ${Buffer.from(encrypted).toString("hex").slice(0, 40)}...`,
	);
}
console.log("Note: Each ciphertext is completely different!");
