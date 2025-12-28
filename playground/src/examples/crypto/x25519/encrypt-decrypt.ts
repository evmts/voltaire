import { AesGcm, Hex, X25519 } from "voltaire";
// End-to-end encryption using X25519 + AES-GCM

const aliceKeypair = X25519.generateKeypair();
const bobKeypair = X25519.generateKeypair();

// Both derive the same shared secret
const sharedSecret = X25519.scalarmult(
	aliceKeypair.secretKey,
	bobKeypair.publicKey,
);
const aesKey = await AesGcm.importKey(sharedSecret);
const plaintext = new TextEncoder().encode(
	"Hello Bob! This is a secret message.",
);

const nonce = AesGcm.generateNonce();
const ciphertext = await AesGcm.encrypt(plaintext, aesKey, nonce);
const bobSharedSecret = X25519.scalarmult(
	bobKeypair.secretKey,
	aliceKeypair.publicKey,
);
const bobAesKey = await AesGcm.importKey(bobSharedSecret);

const decrypted = await AesGcm.decrypt(ciphertext, bobAesKey, nonce);
const decryptedText = new TextDecoder().decode(decrypted);
