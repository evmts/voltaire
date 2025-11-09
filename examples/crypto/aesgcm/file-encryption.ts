/**
 * File Encryption with AES-GCM
 *
 * Demonstrates:
 * - Encrypting file-like data
 * - Storage format (salt + nonce + ciphertext)
 * - Metadata handling with AAD
 * - Complete file encryption/decryption workflow
 */

import * as AesGcm from "../../../src/crypto/AesGcm/index.js";

// Complete file encryption with password
async function encryptFile(
	fileData: Uint8Array,
	password: string,
	metadata?: { filename: string; mimeType: string },
): Promise<Uint8Array> {
	// Generate salt
	const salt = crypto.getRandomValues(new Uint8Array(16));

	// Derive key from password
	const key = await AesGcm.deriveKey(password, salt, 600000, 256);

	// Generate nonce
	const nonce = AesGcm.generateNonce();

	// Optional: use metadata as AAD (authenticated but not encrypted)
	let aad: Uint8Array | undefined;
	if (metadata) {
		const metadataStr = JSON.stringify(metadata);
		aad = new TextEncoder().encode(metadataStr);
	}

	// Encrypt
	const ciphertext = await AesGcm.encrypt(fileData, key, nonce, aad);

	// Format: [salt(16) | nonce(12) | ciphertext+tag]
	const output = new Uint8Array(salt.length + nonce.length + ciphertext.length);
	let offset = 0;
	output.set(salt, offset);
	offset += salt.length;
	output.set(nonce, offset);
	offset += nonce.length;
	output.set(ciphertext, offset);

	return output;
}

async function decryptFile(
	encryptedData: Uint8Array,
	password: string,
	metadata?: { filename: string; mimeType: string },
): Promise<Uint8Array> {
	// Extract components
	const salt = encryptedData.slice(0, 16);
	const nonce = encryptedData.slice(16, 28);
	const ciphertext = encryptedData.slice(28);

	// Derive key
	const key = await AesGcm.deriveKey(password, salt, 600000, 256);

	// Optional AAD
	let aad: Uint8Array | undefined;
	if (metadata) {
		const metadataStr = JSON.stringify(metadata);
		aad = new TextEncoder().encode(metadataStr);
	}

	// Decrypt
	return await AesGcm.decrypt(ciphertext, key, nonce, aad);
}

const fileContent = new TextEncoder().encode(
	"This is the content of a confidential document.\n" +
		"It contains sensitive information that must be encrypted.",
);

const password = "file-encryption-password-2024";

const encrypted = await encryptFile(fileContent, password);

// Decrypt
const decrypted = await decryptFile(encrypted, password);
const decryptedText = new TextDecoder().decode(decrypted);

const imageData = new Uint8Array(1000).fill(0xab); // Simulated image data
const metadata = {
	filename: "confidential.jpg",
	mimeType: "image/jpeg",
};

const encryptedWithMetadata = await encryptFile(imageData, password, metadata);

// Decrypt with correct metadata
const decryptedImage = await decryptFile(
	encryptedWithMetadata,
	password,
	metadata,
);

const wrongMetadata = {
	filename: "tampered.jpg",
	mimeType: "image/jpeg",
};
try {
	await decryptFile(encryptedWithMetadata, password, wrongMetadata);
} catch (error) {}

const fileSizes = [0, 100, 1024, 10_000, 100_000];
for (const size of fileSizes) {
	const data = new Uint8Array(size);
	if (size > 0) crypto.getRandomValues(data);

	const enc = await encryptFile(data, password);
	const overhead = enc.length - size;
}

const files = [
	{ name: "file1.txt", data: new TextEncoder().encode("First file") },
	{ name: "file2.txt", data: new TextEncoder().encode("Second file") },
	{ name: "file3.txt", data: new TextEncoder().encode("Third file") },
];

const sharedPassword = "shared-password";

const encryptedFiles = await Promise.all(
	files.map(async (file) => {
		const encrypted = await encryptFile(file.data, sharedPassword, {
			filename: file.name,
			mimeType: "text/plain",
		});
		return { name: file.name, encrypted };
	}),
);

for (const { name, encrypted } of encryptedFiles) {
}

const sampleData = new TextEncoder().encode("Sample file content");
const encryptedSample = await encryptFile(sampleData, password);

const originalPassword = "old-password";
const newPassword = "new-password";
const sensitiveData = new TextEncoder().encode("Very sensitive data");

// Encrypt with old password
const encryptedOld = await encryptFile(sensitiveData, originalPassword);

// Decrypt and re-encrypt with new password
const decryptedData = await decryptFile(encryptedOld, originalPassword);
const encryptedNew = await encryptFile(decryptedData, newPassword);

// Verify old password no longer works
try {
	await decryptFile(encryptedNew, originalPassword);
} catch (error) {}

// Verify new password works
const finalDecrypted = await decryptFile(encryptedNew, newPassword);
