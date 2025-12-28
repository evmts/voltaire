import { AesGcm, Bytes, Hex } from "@tevm/voltaire";

// AES-GCM - Authenticated encryption

// Generate 256-bit key (recommended)
const key = await AesGcm.generateKey(256);

// Generate 12-byte nonce (CRITICAL: never reuse with same key)
const nonce = AesGcm.generateNonce();

// Encrypt plaintext
const plaintext = new TextEncoder().encode("Hello, AES-GCM!");
const ciphertext = await AesGcm.encrypt(plaintext, key, nonce);
// Ciphertext includes 16-byte auth tag

// Decrypt ciphertext
const decrypted = await AesGcm.decrypt(ciphertext, key, nonce);
const message = new TextDecoder().decode(decrypted);

// Authentication tag prevents tampering
const tampered = Bytes(ciphertext);
tampered[0] ^= 1; // Flip one bit

try {
	await AesGcm.decrypt(tampered, key, nonce);
} catch (e) {
	// Decryption fails - tampered data detected
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

// Wrong AAD fails authentication
try {
	const wrongAad = new TextEncoder().encode("metadata:user-id:456");
	await AesGcm.decrypt(ciphertextWithAad, key, nonceWithAad, wrongAad);
} catch (e) {
	// Authentication failed - wrong AAD
}

// Different key sizes
const key128 = await AesGcm.generateKey(128);
// AES-128 key: 16 bytes

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
