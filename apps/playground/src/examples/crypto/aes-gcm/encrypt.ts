import { AesGcm, Bytes } from "@tevm/voltaire";
// Generate a key
const key = await AesGcm.generateKey(256);

// Data to encrypt
const messages = [
	"Short message",
	"This is a longer message that needs to be encrypted securely.",
	"🔐 Unicode messages work too! 中文 العربية",
	"", // Empty message
];

for (const msg of messages) {
	const plaintext = new TextEncoder().encode(msg);
	const nonce = AesGcm.generateNonce();

	const ciphertext = await AesGcm.encrypt(plaintext, key, nonce);
}
const binaryData = Bytes.random(1024); // 1 KB

const nonce = AesGcm.generateNonce();
const encrypted = await AesGcm.encrypt(binaryData, key, nonce);

// Verify roundtrip
const decrypted = await AesGcm.decrypt(encrypted, key, nonce);
const plaintext = new TextEncoder().encode("Same message");
const nonce1 = AesGcm.generateNonce();
const nonce2 = AesGcm.generateNonce();

const ct1 = await AesGcm.encrypt(plaintext, key, nonce1);
const ct2 = await AesGcm.encrypt(plaintext, key, nonce2);
