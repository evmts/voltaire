import * as AesGcm from "../../../crypto/AesGcm/index.js";

const key = await AesGcm.generateKey(256);

const plaintext = new TextEncoder().encode("Sensitive data");
const aad = new TextEncoder().encode("user:alice,version:1");
const nonce = AesGcm.generateNonce();

// AAD is authenticated but NOT encrypted
const ciphertext = await AesGcm.encrypt(plaintext, key, nonce, aad);
const decrypted = await AesGcm.decrypt(ciphertext, key, nonce, aad);

// 1. Metadata
const metadata = {
	userId: 12345,
	timestamp: Date.now(),
	version: "2.0",
};
const metadataBytes = new TextEncoder().encode(JSON.stringify(metadata));
const data1 = new TextEncoder().encode("User's encrypted data");
const nonce1 = AesGcm.generateNonce();

const ct1 = await AesGcm.encrypt(data1, key, nonce1, metadataBytes);

// 2. Protocol headers
const header = new TextEncoder().encode("PROTOCOL-V1|TLS1.3|AES256");
const payload = new TextEncoder().encode("Application payload");
const nonce2 = AesGcm.generateNonce();

const ct2 = await AesGcm.encrypt(payload, key, nonce2, header);

// 3. Context information
const context = new TextEncoder().encode("session:abc123,ip:192.168.1.1");
const message = new TextEncoder().encode("Transaction data");
const nonce3 = AesGcm.generateNonce();

const ct3 = await AesGcm.encrypt(message, key, nonce3, context);

const testData = new TextEncoder().encode("Test message");
const testAad = new TextEncoder().encode("correct-aad");
const testNonce = AesGcm.generateNonce();

const testCt = await AesGcm.encrypt(testData, key, testNonce, testAad);

// Correct AAD succeeds
try {
	const result = await AesGcm.decrypt(testCt, key, testNonce, testAad);
} catch {}

// Wrong AAD fails
const wrongAad = new TextEncoder().encode("wrong-aad");
try {
	await AesGcm.decrypt(testCt, key, testNonce, wrongAad);
} catch {}

// Missing AAD fails
try {
	await AesGcm.decrypt(testCt, key, testNonce);
} catch {}

const largeAad = new Uint8Array(1024 * 100); // 100 KB
for (let i = 0; i < largeAad.length; i++) {
	largeAad[i] = i % 256;
}

const smallData = new TextEncoder().encode("Small data");
const nonceL = AesGcm.generateNonce();

const ctL = await AesGcm.encrypt(smallData, key, nonceL, largeAad);
const decryptedL = await AesGcm.decrypt(ctL, key, nonceL, largeAad);
