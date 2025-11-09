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

const key256 = await AesGcm.generateKey(256);

const key128 = await AesGcm.generateKey(128);

const message = "Secret message for encryption";
const plaintext = new TextEncoder().encode(message);

// Generate nonce (must be unique per encryption)
const nonce = AesGcm.generateNonce();

// Encrypt
const ciphertext = await AesGcm.encrypt(plaintext, key256, nonce);

// Decrypt
const decrypted = await AesGcm.decrypt(ciphertext, key256, nonce);
const decryptedMessage = new TextDecoder().decode(decrypted);

// Tamper with ciphertext
const tamperedCiphertext = new Uint8Array(ciphertext);
tamperedCiphertext[0] ^= 0xff; // Flip bits in first byte

try {
	await AesGcm.decrypt(tamperedCiphertext, key256, nonce);
} catch (error) {}

// Wrong key
const wrongKey = await AesGcm.generateKey(256);
try {
	await AesGcm.decrypt(ciphertext, wrongKey, nonce);
} catch (error) {}

// Wrong nonce
const wrongNonce = AesGcm.generateNonce();
try {
	await AesGcm.decrypt(ciphertext, key256, wrongNonce);
} catch (error) {}

const messages = ["", "Hi", "Hello, World!", "A".repeat(1000)];

for (const msg of messages) {
	const msgBytes = new TextEncoder().encode(msg);
	const msgNonce = AesGcm.generateNonce();
	const msgCt = await AesGcm.encrypt(msgBytes, key256, msgNonce);
	const msgDec = await AesGcm.decrypt(msgCt, key256, msgNonce);
}

const testMsg = new TextEncoder().encode("Test message");
const testKey = await AesGcm.generateKey(256);
const testNonce = AesGcm.generateNonce();

const ct1 = await AesGcm.encrypt(testMsg, testKey, testNonce);
const ct2 = await AesGcm.encrypt(testMsg, testKey, testNonce);
const ct3 = await AesGcm.encrypt(testMsg, testKey, testNonce);

const allMatch =
	Buffer.from(ct1).toString("hex") === Buffer.from(ct2).toString("hex") &&
	Buffer.from(ct2).toString("hex") === Buffer.from(ct3).toString("hex");
