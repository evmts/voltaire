import { Hex, X25519 } from "voltaire";
// Computing shared secrets via scalar multiplication

// Generate two keypairs
const keypair1 = X25519.generateKeypair();
const keypair2 = X25519.generateKeypair();
const shared1to2 = X25519.scalarmult(keypair1.secretKey, keypair2.publicKey);

const shared2to1 = X25519.scalarmult(keypair2.secretKey, keypair1.publicKey);

// Verify commutativity (ECDH property)
const secretsMatch =
	shared1to2.length === shared2to1.length &&
	shared1to2.every((byte, i) => byte === shared2to1[i]);
const keypair3 = X25519.generateKeypair();
const shared1to3 = X25519.scalarmult(keypair1.secretKey, keypair3.publicKey);

const differentPartnerDifferentSecret = !shared1to2.every(
	(byte, i) => byte === shared1to3[i],
);
