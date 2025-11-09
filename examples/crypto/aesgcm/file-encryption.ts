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

console.log("=== File Encryption with AES-GCM ===\n");

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

// 1. Basic file encryption
console.log("1. Basic File Encryption");
console.log("-".repeat(40));

const fileContent = new TextEncoder().encode(
	"This is the content of a confidential document.\n" +
		"It contains sensitive information that must be encrypted.",
);

const password = "file-encryption-password-2024";

console.log(`File size: ${fileContent.length} bytes`);
console.log(`Password: "${password}"`);

const encrypted = await encryptFile(fileContent, password);

console.log(`\nEncrypted size: ${encrypted.length} bytes`);
console.log(
	`Overhead: ${encrypted.length - fileContent.length} bytes (salt + nonce + tag)`,
);
console.log(
	`Encrypted data: ${Buffer.from(encrypted).toString("hex").slice(0, 60)}...\n`,
);

// Decrypt
const decrypted = await decryptFile(encrypted, password);
const decryptedText = new TextDecoder().decode(decrypted);

console.log("Decrypted successfully");
console.log(
	`Match: ${Buffer.from(decrypted).toString("hex") === Buffer.from(fileContent).toString("hex")}\n`,
);

// 2. File encryption with metadata (AAD)
console.log("2. File Encryption with Metadata (AAD)");
console.log("-".repeat(40));

const imageData = new Uint8Array(1000).fill(0xab); // Simulated image data
const metadata = {
	filename: "confidential.jpg",
	mimeType: "image/jpeg",
};

console.log(`File: ${metadata.filename}`);
console.log(`Type: ${metadata.mimeType}`);
console.log(`Size: ${imageData.length} bytes`);

const encryptedWithMetadata = await encryptFile(imageData, password, metadata);

console.log(`\nEncrypted with AAD: ${encryptedWithMetadata.length} bytes`);

// Decrypt with correct metadata
const decryptedImage = await decryptFile(
	encryptedWithMetadata,
	password,
	metadata,
);
console.log(`Decrypted successfully: ${decryptedImage.length} bytes`);
console.log(`Match: ${decryptedImage.length === imageData.length}\n`);

// 3. AAD tampering detection
console.log("3. AAD Tampering Detection");
console.log("-".repeat(40));

const wrongMetadata = {
	filename: "tampered.jpg",
	mimeType: "image/jpeg",
};

console.log("Attempting decryption with wrong metadata:");
try {
	await decryptFile(encryptedWithMetadata, password, wrongMetadata);
	console.log("❌ Wrong metadata accepted (UNEXPECTED)");
} catch (error) {
	console.log("✓ Wrong metadata rejected (authentication failed)\n");
}

// 4. Different file sizes
console.log("4. Various File Sizes");
console.log("-".repeat(40));

const fileSizes = [0, 100, 1024, 10_000, 100_000];

console.log("Encrypting files of different sizes:");
for (const size of fileSizes) {
	const data = new Uint8Array(size);
	if (size > 0) crypto.getRandomValues(data);

	const enc = await encryptFile(data, password);
	const overhead = enc.length - size;

	console.log(
		`  ${size.toString().padStart(7)} bytes → ${enc.length.toString().padStart(7)} bytes (overhead: ${overhead} bytes)`,
	);
}
console.log();

// 5. Multiple file encryption (same password)
console.log("5. Multiple Files with Same Password");
console.log("-".repeat(40));

const files = [
	{ name: "file1.txt", data: new TextEncoder().encode("First file") },
	{ name: "file2.txt", data: new TextEncoder().encode("Second file") },
	{ name: "file3.txt", data: new TextEncoder().encode("Third file") },
];

const sharedPassword = "shared-password";

console.log("Encrypting multiple files with same password:\n");

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
	console.log(`${name}: ${encrypted.length} bytes`);
	console.log(
		`  Salt+Nonce: ${Buffer.from(encrypted.slice(0, 28)).toString("hex")}`,
	);
}

console.log(
	"\nNote: Each file has unique salt + nonce (different ciphertexts)\n",
);

// 6. Storage format breakdown
console.log("6. Storage Format Details");
console.log("-".repeat(40));

const sampleData = new TextEncoder().encode("Sample file content");
const encryptedSample = await encryptFile(sampleData, password);

console.log("Encrypted file structure:");
console.log("┌─────────────────────────────────────┐");
console.log("│ Salt (16 bytes)                     │ ← PBKDF2 salt");
console.log("├─────────────────────────────────────┤");
console.log("│ Nonce (12 bytes)                    │ ← AES-GCM nonce");
console.log("├─────────────────────────────────────┤");
console.log("│ Encrypted data (variable)           │ ← Ciphertext");
console.log("├─────────────────────────────────────┤");
console.log("│ Authentication tag (16 bytes)       │ ← Part of ciphertext");
console.log("└─────────────────────────────────────┘");

console.log(`\nTotal size: ${encryptedSample.length} bytes`);
console.log(
	`  Bytes  0-15: Salt (${encryptedSample.slice(0, 16).length} bytes)`,
);
console.log(
	`  Bytes 16-27: Nonce (${encryptedSample.slice(16, 28).length} bytes)`,
);
console.log(
	`  Bytes 28-end: Ciphertext+Tag (${encryptedSample.slice(28).length} bytes)`,
);
console.log(`    Original data: ${sampleData.length} bytes`);
console.log(`    Auth tag: 16 bytes`);
console.log(`    Total: ${encryptedSample.slice(28).length} bytes\n`);

// 7. Key rotation example
console.log("7. Key Rotation (Re-encryption)");
console.log("-".repeat(40));

const originalPassword = "old-password";
const newPassword = "new-password";
const sensitiveData = new TextEncoder().encode("Very sensitive data");

// Encrypt with old password
const encryptedOld = await encryptFile(sensitiveData, originalPassword);
console.log(`Encrypted with old password: ${encryptedOld.length} bytes`);

// Decrypt and re-encrypt with new password
const decryptedData = await decryptFile(encryptedOld, originalPassword);
const encryptedNew = await encryptFile(decryptedData, newPassword);
console.log(`Re-encrypted with new password: ${encryptedNew.length} bytes`);

// Verify old password no longer works
try {
	await decryptFile(encryptedNew, originalPassword);
	console.log("❌ Old password still works (UNEXPECTED)");
} catch (error) {
	console.log("✓ Old password no longer works");
}

// Verify new password works
const finalDecrypted = await decryptFile(encryptedNew, newPassword);
console.log("✓ New password works");
console.log(
	`Data preserved: ${Buffer.from(finalDecrypted).toString("hex") === Buffer.from(sensitiveData).toString("hex")}\n`,
);

console.log("=== Complete ===");
