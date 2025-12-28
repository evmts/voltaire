import { Sha256 } from "voltaire";
import { AesGcm, X25519 } from "voltaire";

// Alice (sender)
const aliceSeed = crypto.getRandomValues(new Uint8Array(32));
const aliceKeypair = X25519.keypairFromSeed(aliceSeed);

// Bob (receiver)
const bobSeed = crypto.getRandomValues(new Uint8Array(32));
const bobKeypair = X25519.keypairFromSeed(bobSeed);

// Alice computes shared secret using Bob's public key
const aliceShared = X25519.scalarmult(
	aliceKeypair.secretKey,
	bobKeypair.publicKey,
);

// Bob computes shared secret using Alice's public key
const bobShared = X25519.scalarmult(
	bobKeypair.secretKey,
	aliceKeypair.publicKey,
);

// Use SHA-256 as KDF (in production, use HKDF)
const keyMaterial = Sha256.hash(aliceShared);
const aesKey = await AesGcm.importKey(keyMaterial);

const plaintext = new TextEncoder().encode("Secret message from Alice to Bob!");
const nonce = AesGcm.generateNonce();

const ciphertext = await AesGcm.encrypt(plaintext, aesKey, nonce);

// Alice sends: her public key + nonce + ciphertext
const message = {
	publicKey: aliceKeypair.publicKey,
	nonce: nonce,
	ciphertext: ciphertext,
};

// Bob derives shared secret using Alice's public key
const bobDerivedShared = X25519.scalarmult(
	bobKeypair.secretKey,
	message.publicKey,
);
const bobKeyMaterial = Sha256.hash(bobDerivedShared);
const bobAesKey = await AesGcm.importKey(bobKeyMaterial);

const decrypted = await AesGcm.decrypt(
	message.ciphertext,
	bobAesKey,
	message.nonce,
);
const decryptedMessage = new TextDecoder().decode(decrypted);

// Bob replies to Alice using same shared secret
const replyPlaintext = new TextEncoder().encode(
	"Hello Alice, message received!",
);
const replyNonce = AesGcm.generateNonce();
const replyCiphertext = await AesGcm.encrypt(
	replyPlaintext,
	bobAesKey,
	replyNonce,
);

// Alice decrypts Bob's reply
const replyDecrypted = await AesGcm.decrypt(
	replyCiphertext,
	aesKey,
	replyNonce,
);

// Eve intercepts but doesn't have Bob's private key
const eveSeed = crypto.getRandomValues(new Uint8Array(32));
const eveKeypair = X25519.keypairFromSeed(eveSeed);

// Eve tries to decrypt using wrong key
const eveShared = X25519.scalarmult(
	eveKeypair.secretKey,
	aliceKeypair.publicKey,
);
const eveKeyMaterial = Sha256.hash(eveShared);
const eveAesKey = await AesGcm.importKey(eveKeyMaterial);

try {
	await AesGcm.decrypt(message.ciphertext, eveAesKey, message.nonce);
} catch {}
