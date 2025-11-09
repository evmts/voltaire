/**
 * Password-Based AES-GCM Encryption
 *
 * Demonstrates:
 * - Deriving encryption key from password using PBKDF2
 * - Salt generation and storage
 * - Encrypting data with password-derived key
 * - Complete encrypt/decrypt workflow with password
 * - Secure password handling
 */

import * as AesGcm from "../../../src/crypto/AesGcm/index.js";

// Helper functions for complete encrypt/decrypt workflow
async function encryptWithPassword(
	plaintext: Uint8Array,
	password: string,
): Promise<{ salt: Uint8Array; nonce: Uint8Array; ciphertext: Uint8Array }> {
	// Generate random salt for PBKDF2
	const salt = crypto.getRandomValues(new Uint8Array(16));

	// Derive 256-bit key from password
	// Using 600,000 iterations (OWASP 2023 recommendation)
	const key = await AesGcm.deriveKey(password, salt, 600000, 256);

	// Generate nonce
	const nonce = AesGcm.generateNonce();

	// Encrypt
	const ciphertext = await AesGcm.encrypt(plaintext, key, nonce);

	return { salt, nonce, ciphertext };
}

async function decryptWithPassword(
	encrypted: { salt: Uint8Array; nonce: Uint8Array; ciphertext: Uint8Array },
	password: string,
): Promise<Uint8Array> {
	// Derive same key from password + salt
	const key = await AesGcm.deriveKey(password, encrypted.salt, 600000, 256);

	// Decrypt
	return await AesGcm.decrypt(encrypted.ciphertext, key, encrypted.nonce);
}

const password = "my-secure-passphrase-2024";
const secretData = "Confidential information";
const plaintext = new TextEncoder().encode(secretData);

// Encrypt
const encrypted = await encryptWithPassword(plaintext, password);

// Decrypt
const decrypted = await decryptWithPassword(encrypted, password);
const decryptedMessage = new TextDecoder().decode(decrypted);

const message = new TextEncoder().encode("Test data");
const password1 = "password-one";
const password2 = "password-two";

const enc1 = await encryptWithPassword(message, password1);
const enc2 = await encryptWithPassword(message, password2);

const correctPassword = "correct-password";
const wrongPassword = "wrong-password";

const testData = new TextEncoder().encode("Secret");
const testEncrypted = await encryptWithPassword(testData, correctPassword);

// Correct password
try {
	const dec = await decryptWithPassword(testEncrypted, correctPassword);
} catch (error) {}

// Wrong password
try {
	await decryptWithPassword(testEncrypted, wrongPassword);
} catch (error) {}

const samePassword = "same-password";
const sameMessage = new TextEncoder().encode("Same message");

const result1 = await encryptWithPassword(sameMessage, samePassword);
const result2 = await encryptWithPassword(sameMessage, samePassword);

const testPassword = "test-password";
const testSalt = crypto.getRandomValues(new Uint8Array(16));

// Low iterations (fast, less secure)
const startLow = Date.now();
const keyLow = await AesGcm.deriveKey(testPassword, testSalt, 10000, 256);
const timeLow = Date.now() - startLow;

// Medium iterations (balanced)
const startMed = Date.now();
const keyMed = await AesGcm.deriveKey(testPassword, testSalt, 100000, 256);
const timeMed = Date.now() - startMed;

// High iterations (slow, more secure)
const startHigh = Date.now();
const keyHigh = await AesGcm.deriveKey(testPassword, testSalt, 600000, 256);
const timeHigh = Date.now() - startHigh;

const storageData = new TextEncoder().encode("Data to store");
const storagePassword = "storage-password";

const encryptedData = await encryptWithPassword(storageData, storagePassword);

// Format for storage (concatenate salt + nonce + ciphertext)
const storedBytes = new Uint8Array(
	encryptedData.salt.length +
		encryptedData.nonce.length +
		encryptedData.ciphertext.length,
);
let offset = 0;
storedBytes.set(encryptedData.salt, offset);
offset += encryptedData.salt.length;
storedBytes.set(encryptedData.nonce, offset);
offset += encryptedData.nonce.length;
storedBytes.set(encryptedData.ciphertext, offset);

// Extract and decrypt
const extractedSalt = storedBytes.slice(0, 16);
const extractedNonce = storedBytes.slice(16, 28);
const extractedCiphertext = storedBytes.slice(28);

const extractedDecrypted = await decryptWithPassword(
	{
		salt: extractedSalt,
		nonce: extractedNonce,
		ciphertext: extractedCiphertext,
	},
	storagePassword,
);

const pwd = "test";
const salt = crypto.getRandomValues(new Uint8Array(16));
const data = new TextEncoder().encode("test data");

const key128 = await AesGcm.deriveKey(pwd, salt, 100000, 128);
const key256 = await AesGcm.deriveKey(pwd, salt, 100000, 256);

const nonce128 = AesGcm.generateNonce();
const nonce256 = AesGcm.generateNonce();

const ct128 = await AesGcm.encrypt(data, key128, nonce128);
const ct256 = await AesGcm.encrypt(data, key256, nonce256);
