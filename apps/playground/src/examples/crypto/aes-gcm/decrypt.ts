import { AesGcm, Bytes } from "@tevm/voltaire";
// Setup: generate key and encrypt some data
const key = await AesGcm.generateKey(256);
const plaintext = new TextEncoder().encode("This is a secret message!");
const nonce = AesGcm.generateNonce();
const ciphertext = await AesGcm.encrypt(plaintext, key, nonce);

const decrypted = await AesGcm.decrypt(ciphertext, key, nonce);
const message = new TextDecoder().decode(decrypted);
const wrongKey = await AesGcm.generateKey(256);
try {
	await AesGcm.decrypt(ciphertext, wrongKey, nonce);
} catch {}
const wrongNonce = AesGcm.generateNonce();
try {
	await AesGcm.decrypt(ciphertext, key, wrongNonce);
} catch {}
const modified = Bytes(ciphertext);
modified[5] ^= 1; // Flip one bit
try {
	await AesGcm.decrypt(modified, key, nonce);
} catch {}
const tamperedTag = Bytes(ciphertext);
tamperedTag[tamperedTag.length - 1] ^= 1; // Flip bit in tag
try {
	await AesGcm.decrypt(tamperedTag, key, nonce);
} catch {}
const truncated = ciphertext.slice(0, 10); // Remove tag
try {
	await AesGcm.decrypt(truncated, key, nonce);
} catch {}
