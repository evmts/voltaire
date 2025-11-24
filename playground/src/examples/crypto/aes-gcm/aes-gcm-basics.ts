import * as AesGcm from "../../../crypto/AesGcm/index.js";

// Generate 256-bit AES key (recommended)
const key256 = await AesGcm.generateKey(256);

// Generate 128-bit AES key (faster, still secure)
const key128 = await AesGcm.generateKey(128);

const plaintext = new TextEncoder().encode("Hello, AES-GCM!");
const nonce = AesGcm.generateNonce(); // 12-byte random nonce (IV)

// Encrypt returns ciphertext + 16-byte authentication tag
const ciphertext = await AesGcm.encrypt(plaintext, key256, nonce);

const decrypted = await AesGcm.decrypt(ciphertext, key256, nonce);
const message = new TextDecoder().decode(decrypted);

// CRITICAL: Never reuse nonce with same key
const nonce1 = AesGcm.generateNonce();
const nonce2 = AesGcm.generateNonce();

// Attempt to modify ciphertext
const tampered = new Uint8Array(ciphertext);
tampered[0] ^= 1; // Flip one bit

try {
	await AesGcm.decrypt(tampered, key256, nonce);
} catch {}

const data = new TextEncoder().encode("Secret message");
const aad = new TextEncoder().encode("user-id:123,timestamp:1699900000");
const nonceWithAad = AesGcm.generateNonce();

// AAD is authenticated but not encrypted
const ciphertextWithAad = await AesGcm.encrypt(data, key256, nonceWithAad, aad);
const decryptedWithAad = await AesGcm.decrypt(
	ciphertextWithAad,
	key256,
	nonceWithAad,
	aad,
);

// Wrong AAD fails
const wrongAad = new TextEncoder().encode("user-id:456,timestamp:1699900000");
try {
	await AesGcm.decrypt(ciphertextWithAad, key256, nonceWithAad, wrongAad);
} catch {}
