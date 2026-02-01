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

const key = ChaCha20Poly1305.generateKey();
const nonce = ChaCha20Poly1305.generateNonce();
const plaintext = new TextEncoder().encode("Secret payload");
const aad = new TextEncoder().encode("user-id:12345,timestamp:2024-01-01");

const ciphertext = ChaCha20Poly1305.encrypt(plaintext, key, nonce, aad);
const decrypted = ChaCha20Poly1305.decrypt(ciphertext, key, nonce, aad);
const wrongAad = new TextEncoder().encode("user-id:99999,timestamp:2024-01-01");
try {
	ChaCha20Poly1305.decrypt(ciphertext, key, nonce, wrongAad);
} catch (error) {
	if (error instanceof DecryptionError) {
	}
}
try {
	ChaCha20Poly1305.decrypt(ciphertext, key, nonce); // No AAD provided
} catch (error) {
	if (error instanceof DecryptionError) {
	}
}

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

const decryptedData = decryptRecord(record);
const tamperedRecord = { ...record, version: 2 }; // Attacker changes version
try {
	decryptRecord(tamperedRecord);
} catch (error) {}
