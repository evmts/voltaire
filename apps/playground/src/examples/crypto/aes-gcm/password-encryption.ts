import { AesGcm, Bytes } from "@tevm/voltaire";
const password = "user-secret-password-123";
const salt = Bytes.random(16);

// PBKDF2 parameters
const iterations = 100_000; // Recommended: 100k-600k iterations
const keySize = 256; // bits

const key = await AesGcm.deriveKey(password, salt, iterations, keySize);

const plaintext = new TextEncoder().encode(
	"This is encrypted with a password!",
);
const nonce = AesGcm.generateNonce();

const ciphertext = await AesGcm.encrypt(plaintext, key, nonce);

// Derive key again from same password + salt
const decryptKey = await AesGcm.deriveKey(password, salt, iterations, keySize);
const decrypted = await AesGcm.decrypt(ciphertext, decryptKey, nonce);

const wrongPassword = "wrong-password";
const wrongKey = await AesGcm.deriveKey(
	wrongPassword,
	salt,
	iterations,
	keySize,
);

try {
	await AesGcm.decrypt(ciphertext, wrongKey, nonce);
} catch {}

// Store: salt + nonce + ciphertext
const stored = Bytes.concat(salt, nonce, ciphertext);

// Retrieve and decrypt
const retrievedSalt = stored.slice(0, 16);
const retrievedNonce = stored.slice(16, 28);
const retrievedCiphertext = stored.slice(28);

const retrieveKey = await AesGcm.deriveKey(
	password,
	retrievedSalt,
	iterations,
	keySize,
);
const retrieved = await AesGcm.decrypt(
	retrievedCiphertext,
	retrieveKey,
	retrievedNonce,
);

const weakPassword = "123456";
const strongPassword = "correct-horse-battery-staple-2024!";

const salt1 = Bytes(Array(16).fill(1));
const salt2 = Bytes(Array(16).fill(2));

const key1 = await AesGcm.deriveKey(password, salt1, 10000, 256);
const key2 = await AesGcm.deriveKey(password, salt2, 10000, 256);

const exp1 = await AesGcm.exportKey(key1);
const exp2 = await AesGcm.exportKey(key2);

const start = Date.now();
await AesGcm.deriveKey("test", Bytes.random(16), 100_000, 256);
const elapsed = Date.now() - start;
