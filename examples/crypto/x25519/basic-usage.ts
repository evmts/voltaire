/**
 * Basic X25519 Usage (ECDH Key Exchange)
 *
 * Demonstrates:
 * - Keypair generation
 * - Diffie-Hellman key exchange
 * - Shared secret computation
 * - Key validation
 * - Secure key derivation
 */

import * as X25519 from "../../../src/crypto/X25519/index.js";
import { Hex } from "../../../src/primitives/Hex/index.js";

const aliceKeypair = X25519.generateKeypair();
const bobKeypair = X25519.generateKeypair();

// Alice computes shared secret using her secret key and Bob's public key
const aliceShared = X25519.scalarmult(
	aliceKeypair.secretKey,
	bobKeypair.publicKey,
);

// Bob computes shared secret using his secret key and Alice's public key
const bobShared = X25519.scalarmult(
	bobKeypair.secretKey,
	aliceKeypair.publicKey,
);

const secretsMatch = Hex.fromBytes(aliceShared) === Hex.fromBytes(bobShared);

const validSecretKey = aliceKeypair.secretKey;
const validPublicKey = aliceKeypair.publicKey;

// Invalid keys - these would fail validation
const invalidShort = Hex("0x" + "ab".repeat(16));
const invalidLong = Hex("0x" + "ab".repeat(64));

const secretKey = X25519.generateSecretKey();
const derivedPublicKey = X25519.derivePublicKey(secretKey);

const isValid = X25519.validatePublicKey(derivedPublicKey);

const seedBytes = new Uint8Array(32);
crypto.getRandomValues(seedBytes);
const seed = Hex.fromBytes(seedBytes);

const keypair1 = X25519.keypairFromSeed(seed);
const keypair2 = X25519.keypairFromSeed(seed);

const publicKeysMatch =
	Hex.fromBytes(keypair1.publicKey) === Hex.fromBytes(keypair2.publicKey);

const carol = X25519.generateKeypair();
const dave = X25519.generateKeypair();
const aliceCarol = X25519.scalarmult(aliceKeypair.secretKey, carol.publicKey);
const bobDave = X25519.scalarmult(bobKeypair.secretKey, dave.publicKey);
const msgAliceShared = X25519.scalarmult(
	aliceKeypair.secretKey,
	bobKeypair.publicKey,
);
const msgBobShared = X25519.scalarmult(
	bobKeypair.secretKey,
	aliceKeypair.publicKey,
);
