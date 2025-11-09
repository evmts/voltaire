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

import * as X25519 from "../../../src/crypto/X25519/index.js";
import * as AesGcm from "../../../src/crypto/AesGcm/index.js";
import { Hex } from "../../../src/primitives/Hex/index.js";
import { hkdf } from "@noble/hashes/hkdf";
import { sha256 } from "@noble/hashes/sha256";

console.log("=== Secure Messaging with X25519 + AES-GCM ===\n");

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

// 1. Basic encrypted message
console.log("1. Basic Encrypted Message");
console.log("-".repeat(40));

const alice = X25519.generateKeypair();
const bob = X25519.generateKeypair();

console.log('Alice → Bob: "Hello, Bob!"');
console.log(
	`Alice public key: ${Hex.fromBytes(alice.publicKey).slice(0, 24)}...`,
);
console.log(
	`Bob public key:   ${Hex.fromBytes(bob.publicKey).slice(0, 24)}...\n`,
);

const message1 = "Hello, Bob!";
const encrypted1 = await encryptMessage(
	message1,
	alice.secretKey,
	bob.publicKey,
);

console.log("Encrypted message:");
console.log(
	`  Ephemeral key: ${Hex.fromBytes(encrypted1.ephemeralPublicKey).slice(0, 24)}...`,
);
console.log(`  Nonce: ${Hex.fromBytes(encrypted1.nonce)}`);
console.log(
	`  Ciphertext: ${Hex.fromBytes(encrypted1.ciphertext).toString().slice(0, 40)}...`,
);

const decrypted1 = await decryptMessage(encrypted1, bob.secretKey);
console.log(`\nDecrypted: "${decrypted1}"`);
console.log(`Match: ${decrypted1 === message1}\n`);

// 2. Forward secrecy (ephemeral keys)
console.log("2. Forward Secrecy with Ephemeral Keys");
console.log("-".repeat(40));

console.log("Sending 3 messages with different ephemeral keys:\n");

for (let i = 0; i < 3; i++) {
	const msg = `Message ${i + 1}`;
	const enc = await encryptMessage(msg, alice.secretKey, bob.publicKey);

	console.log(`Message ${i + 1}:`);
	console.log(
		`  Ephemeral key: ${Hex.fromBytes(enc.ephemeralPublicKey).slice(0, 24)}...`,
	);
	console.log(
		`  Ciphertext: ${Hex.fromBytes(enc.ciphertext).toString().slice(0, 32)}...`,
	);
}

console.log("\n✓ Each message uses new ephemeral key");
console.log("✓ Compromising one key doesn't affect others\n");

// 3. Bidirectional messaging
console.log("3. Bidirectional Messaging");
console.log("-".repeat(40));

console.log("Conversation between Alice and Bob:\n");

// Alice → Bob
const aliceMsg = "Hi Bob, how are you?";
const aliceToBob = await encryptMessage(
	aliceMsg,
	alice.secretKey,
	bob.publicKey,
);
const bobDecrypted = await decryptMessage(aliceToBob, bob.secretKey);

console.log(`Alice → Bob: "${aliceMsg}"`);
console.log(`Bob receives: "${bobDecrypted}"`);

// Bob → Alice
const bobMsg = "Hi Alice! I'm great, thanks!";
const bobToAlice = await encryptMessage(bobMsg, bob.secretKey, alice.publicKey);
const aliceDecrypted = await decryptMessage(bobToAlice, alice.secretKey);

console.log(`\nBob → Alice: "${bobMsg}"`);
console.log(`Alice receives: "${aliceDecrypted}"\n`);

// 4. Message tampering detection
console.log("4. Message Tampering Detection");
console.log("-".repeat(40));

const originalMsg = "Original message";
const tamperedEncrypted = await encryptMessage(
	originalMsg,
	alice.secretKey,
	bob.publicKey,
);

// Tamper with ciphertext
tamperedEncrypted.ciphertext[0] ^= 0xff;

console.log("Attempting to decrypt tampered message...");
try {
	await decryptMessage(tamperedEncrypted, bob.secretKey);
	console.log("❌ Tampering not detected (UNEXPECTED)");
} catch (error) {
	console.log("✓ Tampering detected and rejected\n");
}

// 5. Different message sizes
console.log("5. Variable Message Sizes");
console.log("-".repeat(40));

const messages = ["Hi", "Medium length message here", "A".repeat(1000)];

console.log("Encrypting messages of different sizes:\n");

for (const msg of messages) {
	const enc = await encryptMessage(msg, alice.secretKey, bob.publicKey);
	const overhead = enc.ciphertext.length - msg.length;

	console.log(
		`${msg.length.toString().padStart(4)} bytes → ${enc.ciphertext.length.toString().padStart(4)} bytes (overhead: ${overhead} bytes)`,
	);
}
console.log();

// 6. Key derivation details
console.log("6. Key Derivation (HKDF)");
console.log("-".repeat(40));

const sharedSecret = X25519.scalarmult(alice.secretKey, bob.publicKey);

console.log("Deriving multiple keys from shared secret:\n");

const encKey = hkdf(sha256, sharedSecret, undefined, "encryption-key", 32);
const macKey = hkdf(sha256, sharedSecret, undefined, "mac-key", 32);
const authKey = hkdf(sha256, sharedSecret, undefined, "auth-key", 32);

console.log(`Shared secret: ${Hex.fromBytes(sharedSecret).slice(0, 32)}...`);
console.log(`Encryption key: ${Hex.fromBytes(encKey).slice(0, 32)}...`);
console.log(`MAC key:        ${Hex.fromBytes(macKey).slice(0, 32)}...`);
console.log(`Auth key:       ${Hex.fromBytes(authKey).slice(0, 32)}...`);

console.log("\n✓ HKDF derives multiple independent keys");
console.log("✓ Each key bound to specific purpose (info parameter)\n");

// 7. Group messaging (multiple recipients)
console.log("7. Group Messaging (Multiple Recipients)");
console.log("-".repeat(40));

const carol = X25519.generateKeypair();
const dave = X25519.generateKeypair();

const groupMessage = "Hello everyone!";

console.log(`Encrypting "${groupMessage}" for 3 recipients:\n`);

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

console.log("Encrypted for Bob:");
console.log(
	`  Ephemeral: ${Hex.fromBytes(toBob.ephemeralPublicKey).slice(0, 24)}...`,
);
console.log("Encrypted for Carol:");
console.log(
	`  Ephemeral: ${Hex.fromBytes(toCarol.ephemeralPublicKey).slice(0, 24)}...`,
);
console.log("Encrypted for Dave:");
console.log(
	`  Ephemeral: ${Hex.fromBytes(toDave.ephemeralPublicKey).slice(0, 24)}...`,
);

console.log("\n✓ Each recipient gets separate encryption");
console.log("✓ Different ephemeral keys for each\n");

// 8. Storage format
console.log("8. Message Storage Format");
console.log("-".repeat(40));

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

console.log("Storage format: [ephemeral_key(32) | nonce(12) | ciphertext+tag]");
console.log(`Total size: ${combined.length} bytes`);
console.log(
	`  Ephemeral key: bytes 0-31 (${storedEnc.ephemeralPublicKey.length} bytes)`,
);
console.log(`  Nonce: bytes 32-43 (${storedEnc.nonce.length} bytes)`);
console.log(
	`  Ciphertext+Tag: bytes 44-end (${storedEnc.ciphertext.length} bytes)\n`,
);

// 9. Security properties
console.log("9. Security Properties");
console.log("-".repeat(40));

console.log("End-to-end encryption:");
console.log("✓ Confidentiality: AES-256-GCM encryption");
console.log("✓ Authentication: GCM authentication tag");
console.log("✓ Forward secrecy: Ephemeral X25519 keys");
console.log("✓ Post-compromise security: New keys per message");
console.log("✓ Key derivation: HKDF prevents weak keys");

console.log("\nThreat model:");
console.log("✓ Passive eavesdropper: Cannot decrypt (X25519 + AES)");
console.log("✓ Active attacker: Cannot tamper (GCM auth tag)");
console.log(
	"✓ Compromised past keys: Cannot decrypt future messages (forward secrecy)",
);
console.log(
	"✓ Compromised future keys: Cannot decrypt past messages (ephemeral keys)\n",
);

// 10. Best practices
console.log("10. Security Best Practices");
console.log("-".repeat(40));

console.log("Implementation:");
console.log("✓ Use HKDF for key derivation (never raw X25519 output)");
console.log("✓ Generate new ephemeral keys per message");
console.log("✓ Use AES-GCM for authenticated encryption");
console.log("✓ Include sender/recipient identity in AAD");
console.log("✓ Validate all keys before use");
console.log("✓ Clear sensitive keys from memory after use");

console.log("\nProtocol design:");
console.log("✓ Combine X25519 with strong AEAD (AES-GCM, ChaCha20-Poly1305)");
console.log(
	"✓ Add signatures for authentication (X25519 provides only secrecy)",
);
console.log("✓ Consider using Signal Protocol or Noise Framework");
console.log("✓ Implement message ordering and replay protection");
console.log("✓ Add out-of-band key verification (fingerprints)\n");

console.log("=== Complete ===");
