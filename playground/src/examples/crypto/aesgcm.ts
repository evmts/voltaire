import { AesGcm, Bytes, Hex } from "@tevm/voltaire";

// AES-GCM - Authenticated encryption

// Generate 256-bit key (recommended)
const key = await AesGcm.generateKey(256);
console.log("Generated 256-bit key");

// Generate 12-byte nonce (CRITICAL: never reuse with same key)
const nonce = AesGcm.generateNonce();
console.log("Nonce:", Hex.fromBytes(nonce));

// Encrypt plaintext
const plaintext = new TextEncoder().encode("Hello, AES-GCM!");
const ciphertext = await AesGcm.encrypt(plaintext, key, nonce);
console.log("Ciphertext:", Hex.fromBytes(ciphertext));
// Ciphertext includes 16-byte auth tag

// Decrypt ciphertext
const decrypted = await AesGcm.decrypt(ciphertext, key, nonce);
const message = new TextDecoder().decode(decrypted);
console.log("Decrypted message:", message);

// Authentication tag prevents tampering
const tampered = new Uint8Array(ciphertext);
tampered[0] ^= 1; // Flip one bit

try {
	await AesGcm.decrypt(tampered, key, nonce);
	console.log("Tamper detection failed!");
} catch (e) {
	console.log("Tamper detected - decryption failed as expected");
}

// Associated Authenticated Data (AAD)
// AAD is authenticated but NOT encrypted
const data = new TextEncoder().encode("Secret payload");
const aad = new TextEncoder().encode("metadata:user-id:123");
const nonceWithAad = AesGcm.generateNonce();

const ciphertextWithAad = await AesGcm.encrypt(data, key, nonceWithAad, aad);
const decryptedWithAad = await AesGcm.decrypt(
	ciphertextWithAad,
	key,
	nonceWithAad,
	aad,
);
console.log("AAD decrypted:", new TextDecoder().decode(decryptedWithAad));

// Wrong AAD fails authentication
try {
	const wrongAad = new TextEncoder().encode("metadata:user-id:456");
	await AesGcm.decrypt(ciphertextWithAad, key, nonceWithAad, wrongAad);
	console.log("Wrong AAD detection failed!");
} catch (e) {
	console.log("Wrong AAD detected - authentication failed as expected");
}

// Different key sizes
const key128 = await AesGcm.generateKey(128);
console.log("Generated 128-bit key");

// Multiple messages require unique nonces
const nonce1 = AesGcm.generateNonce();
const nonce2 = AesGcm.generateNonce();
const ct1 = await AesGcm.encrypt(
	new TextEncoder().encode("Message 1"),
	key,
	nonce1,
);
const ct2 = await AesGcm.encrypt(
	new TextEncoder().encode("Message 2"),
	key,
	nonce2,
);
console.log("Encrypted 2 messages with unique nonces");
console.log("Nonce 1:", Hex.fromBytes(nonce1));
console.log("Nonce 2:", Hex.fromBytes(nonce2));
