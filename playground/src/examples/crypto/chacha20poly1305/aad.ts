/**
 * ChaCha20-Poly1305 Associated Authenticated Data (AAD)
 *
 * AAD allows you to authenticate additional data without encrypting it.
 * The AAD is included in the authentication tag calculation.
 *
 * Use cases:
 * - Packet headers that must be readable but not modified
 * - Database record IDs that identify the encrypted data
 * - Protocol version numbers
 * - Message sequence numbers
 */
import { ChaCha20Poly1305, DecryptionError } from "@tevm/voltaire";

console.log("=== ChaCha20-Poly1305 Associated Authenticated Data ===\n");

const key = ChaCha20Poly1305.generateKey();
const nonce = ChaCha20Poly1305.generateNonce();

// Encrypt with AAD
console.log("=== Encryption with AAD ===");
const plaintext = new TextEncoder().encode("Secret payload");
const aad = new TextEncoder().encode("user-id:12345,timestamp:2024-01-01");

console.log(`Plaintext: "${new TextDecoder().decode(plaintext)}"`);
console.log(`AAD: "${new TextDecoder().decode(aad)}"`);

const ciphertext = ChaCha20Poly1305.encrypt(plaintext, key, nonce, aad);
console.log(`Ciphertext: ${Buffer.from(ciphertext).toString("hex")}`);

// Decrypt with correct AAD
console.log("\n=== Decryption with Correct AAD ===");
const decrypted = ChaCha20Poly1305.decrypt(ciphertext, key, nonce, aad);
console.log(`Decrypted: "${new TextDecoder().decode(decrypted)}"`);

// Attempt decryption with wrong AAD
console.log("\n=== Decryption with Wrong AAD ===");
const wrongAad = new TextEncoder().encode("user-id:99999,timestamp:2024-01-01");
try {
	ChaCha20Poly1305.decrypt(ciphertext, key, nonce, wrongAad);
	console.log("ERROR: Should have thrown!");
} catch (error) {
	if (error instanceof DecryptionError) {
		console.log(`DecryptionError caught: ${error.message}`);
		console.log("AAD mismatch detected correctly!");
	}
}

// Attempt decryption without AAD
console.log("\n=== Decryption Without AAD (when encrypted with AAD) ===");
try {
	ChaCha20Poly1305.decrypt(ciphertext, key, nonce); // No AAD provided
	console.log("ERROR: Should have thrown!");
} catch (error) {
	if (error instanceof DecryptionError) {
		console.log(`DecryptionError caught: ${error.message}`);
		console.log("Missing AAD detected correctly!");
	}
}

// Real-world example: Encrypted database record
console.log("\n=== Real-World Example: Encrypted Database Record ===");

interface EncryptedRecord {
	id: string;
	version: number;
	nonce: Uint8Array;
	ciphertext: Uint8Array;
}

function encryptRecord(
	id: string,
	version: number,
	data: string,
): EncryptedRecord {
	const nonce = ChaCha20Poly1305.generateNonce();
	const plaintext = new TextEncoder().encode(data);
	// AAD includes the record ID and version - authenticated but not encrypted
	const aad = new TextEncoder().encode(`${id}:${version}`);
	const ciphertext = ChaCha20Poly1305.encrypt(plaintext, key, nonce, aad);

	return { id, version, nonce, ciphertext };
}

function decryptRecord(record: EncryptedRecord): string {
	const aad = new TextEncoder().encode(`${record.id}:${record.version}`);
	const decrypted = ChaCha20Poly1305.decrypt(
		record.ciphertext,
		key,
		record.nonce,
		aad,
	);
	return new TextDecoder().decode(decrypted);
}

const record = encryptRecord("user-42", 1, "Sensitive user data");
console.log(`Record ID: ${record.id} (visible, authenticated)`);
console.log(`Record Version: ${record.version} (visible, authenticated)`);
console.log(
	`Ciphertext: ${Buffer.from(record.ciphertext).toString("hex").slice(0, 40)}...`,
);

const decryptedData = decryptRecord(record);
console.log(`Decrypted data: "${decryptedData}"`);

// Demonstrate that modifying visible metadata fails authentication
console.log("\n=== Attempting to Tamper with Record Metadata ===");
const tamperedRecord = { ...record, version: 2 }; // Attacker changes version
try {
	decryptRecord(tamperedRecord);
	console.log("ERROR: Should have thrown!");
} catch (error) {
	console.log("Tampered metadata detected - decryption failed!");
}
