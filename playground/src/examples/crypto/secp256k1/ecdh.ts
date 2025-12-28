import { Hex, Secp256k1 } from "voltaire";
// ECDH key exchange

// Alice generates keypair
const alicePrivateKey = Secp256k1.PrivateKey.random();
const alicePublicKey = Secp256k1.derivePublicKey(alicePrivateKey);

// Bob generates keypair
const bobPrivateKey = Secp256k1.PrivateKey.random();
const bobPublicKey = Secp256k1.derivePublicKey(bobPrivateKey);

// Alice computes shared secret: alicePrivate * bobPublic
const aliceShared = Secp256k1.ecdh(alicePrivateKey, bobPublicKey);

// Bob computes shared secret: bobPrivate * alicePublic
const bobShared = Secp256k1.ecdh(bobPrivateKey, alicePublicKey);

// Verify they match
const match =
	aliceShared.length === bobShared.length &&
	aliceShared.every((byte, i) => byte === bobShared[i]);
