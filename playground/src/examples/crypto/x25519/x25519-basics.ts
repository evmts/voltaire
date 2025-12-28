import { Hex, X25519 } from "voltaire";
// X25519 key exchange basics

const aliceKeypair = X25519.generateKeypair();
const bobKeypair = X25519.generateKeypair();
const aliceShared = X25519.scalarmult(
	aliceKeypair.secretKey,
	bobKeypair.publicKey,
);
const bobShared = X25519.scalarmult(
	bobKeypair.secretKey,
	aliceKeypair.publicKey,
);

// Verify they match
const match =
	aliceShared.length === bobShared.length &&
	aliceShared.every((byte, i) => byte === bobShared[i]);
const seed = new Uint8Array(32);
crypto.getRandomValues(seed);
const keypair = X25519.keypairFromSeed(seed);
const secretKey = X25519.generateSecretKey();
const publicKey = X25519.derivePublicKey(secretKey);
