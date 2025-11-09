/**
 * Secure Messaging with X25519 + AES-GCM
 *
 * Demonstrates:
 * - X25519 key exchange for secure channels
 * - Proper key derivation with HKDF
 * - Authenticated encryption with AES-GCM
 * - Complete end-to-end encrypted messaging
 * - Ephemeral vs static keys
 */

import { hkdf } from "@noble/hashes/hkdf";
import { sha256 } from "@noble/hashes/sha256";
import * as AesGcm from "../../../src/crypto/AesGcm/index.js";
import * as X25519 from "../../../src/crypto/X25519/index.js";
import { Hex } from "../../../src/primitives/Hex/index.js";

// Message encryption using X25519 + HKDF + AES-GCM
async function encryptMessage(
	message: string,
	senderSecretKey: Uint8Array,
	recipientPublicKey: Uint8Array,
	senderEphemeralKeypair?: { secretKey: Uint8Array; publicKey: Uint8Array },
): Promise<{
	ephemeralPublicKey: Uint8Array;
	nonce: Uint8Array;
	ciphertext: Uint8Array;
}> {
	// Generate ephemeral keypair for this message (forward secrecy)
	const ephemeral = senderEphemeralKeypair || X25519.generateKeypair();

	// Compute shared secret
	const sharedSecret = X25519.scalarmult(
		ephemeral.secretKey,
		recipientPublicKey,
	);

	// Derive encryption key using HKDF (CRITICAL: never use raw shared secret!)
	const derivedKey = hkdf(
		sha256,
		sharedSecret,
		undefined,
		"x25519-messaging-v1",
		32,
	);

	// Import derived key for AES-GCM
	const aesKey = await AesGcm.importKey(derivedKey);

	// Encrypt message
	const plaintext = new TextEncoder().encode(message);
	const nonce = AesGcm.generateNonce();
	const ciphertext = await AesGcm.encrypt(plaintext, aesKey, nonce);

	return {
		ephemeralPublicKey: ephemeral.publicKey,
		nonce,
		ciphertext,
	};
}

async function decryptMessage(
	encrypted: {
		ephemeralPublicKey: Uint8Array;
		nonce: Uint8Array;
		ciphertext: Uint8Array;
	},
	recipientSecretKey: Uint8Array,
): Promise<string> {
	// Compute same shared secret
	const sharedSecret = X25519.scalarmult(
		recipientSecretKey,
		encrypted.ephemeralPublicKey,
	);

	// Derive same encryption key
	const derivedKey = hkdf(
		sha256,
		sharedSecret,
		undefined,
		"x25519-messaging-v1",
		32,
	);
	const aesKey = await AesGcm.importKey(derivedKey);

	// Decrypt message
	const plaintext = await AesGcm.decrypt(
		encrypted.ciphertext,
		aesKey,
		encrypted.nonce,
	);

	return new TextDecoder().decode(plaintext);
}

const alice = X25519.generateKeypair();
const bob = X25519.generateKeypair();

const message1 = "Hello, Bob!";
const encrypted1 = await encryptMessage(
	message1,
	alice.secretKey,
	bob.publicKey,
);

const decrypted1 = await decryptMessage(encrypted1, bob.secretKey);

for (let i = 0; i < 3; i++) {
	const msg = `Message ${i + 1}`;
	const enc = await encryptMessage(msg, alice.secretKey, bob.publicKey);
}

// Alice → Bob
const aliceMsg = "Hi Bob, how are you?";
const aliceToBob = await encryptMessage(
	aliceMsg,
	alice.secretKey,
	bob.publicKey,
);
const bobDecrypted = await decryptMessage(aliceToBob, bob.secretKey);

// Bob → Alice
const bobMsg = "Hi Alice! I'm great, thanks!";
const bobToAlice = await encryptMessage(bobMsg, bob.secretKey, alice.publicKey);
const aliceDecrypted = await decryptMessage(bobToAlice, alice.secretKey);

const originalMsg = "Original message";
const tamperedEncrypted = await encryptMessage(
	originalMsg,
	alice.secretKey,
	bob.publicKey,
);

// Tamper with ciphertext
tamperedEncrypted.ciphertext[0] ^= 0xff;
try {
	await decryptMessage(tamperedEncrypted, bob.secretKey);
} catch (error) {}

const messages = ["Hi", "Medium length message here", "A".repeat(1000)];

for (const msg of messages) {
	const enc = await encryptMessage(msg, alice.secretKey, bob.publicKey);
	const overhead = enc.ciphertext.length - msg.length;
}

const sharedSecret = X25519.scalarmult(alice.secretKey, bob.publicKey);

const encKey = hkdf(sha256, sharedSecret, undefined, "encryption-key", 32);
const macKey = hkdf(sha256, sharedSecret, undefined, "mac-key", 32);
const authKey = hkdf(sha256, sharedSecret, undefined, "auth-key", 32);

const carol = X25519.generateKeypair();
const dave = X25519.generateKeypair();

const groupMessage = "Hello everyone!";

const toBob = await encryptMessage(
	groupMessage,
	alice.secretKey,
	bob.publicKey,
);
const toCarol = await encryptMessage(
	groupMessage,
	alice.secretKey,
	carol.publicKey,
);
const toDave = await encryptMessage(
	groupMessage,
	alice.secretKey,
	dave.publicKey,
);

const storedMsg = "Stored message";
const storedEnc = await encryptMessage(
	storedMsg,
	alice.secretKey,
	bob.publicKey,
);

const combined = new Uint8Array(
	storedEnc.ephemeralPublicKey.length +
		storedEnc.nonce.length +
		storedEnc.ciphertext.length,
);
let offset = 0;
combined.set(storedEnc.ephemeralPublicKey, offset);
offset += storedEnc.ephemeralPublicKey.length;
combined.set(storedEnc.nonce, offset);
offset += storedEnc.nonce.length;
combined.set(storedEnc.ciphertext, offset);
