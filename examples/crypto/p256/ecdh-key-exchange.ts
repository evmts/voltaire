import * as P256 from "../../../src/crypto/P256/index.js";
import { SHA256 } from "../../../src/crypto/SHA256/index.js";
import { Hex } from "../../../src/primitives/Hex/index.js";

// Alice generates keypair
const alicePrivate = new Uint8Array(32);
crypto.getRandomValues(alicePrivate);
const alicePublic = P256.derivePublicKey(alicePrivate);

// Bob generates keypair
const bobPrivate = new Uint8Array(32);
crypto.getRandomValues(bobPrivate);
const bobPublic = P256.derivePublicKey(bobPrivate);

// Alice computes shared secret
const sharedSecretAlice = P256.ecdh(alicePrivate, bobPublic);

// Bob computes shared secret
const sharedSecretBob = P256.ecdh(bobPrivate, alicePublic);

// Verify secrets match
const secretsMatch =
	Hex.fromBytes(sharedSecretAlice) === Hex.fromBytes(sharedSecretBob);

// Simple KDF example: hash the shared secret
const derivedKey = SHA256.hash(sharedSecretAlice);

// Session 1
const session1AlicePrivate = new Uint8Array(32);
crypto.getRandomValues(session1AlicePrivate);
const session1AlicePublic = P256.derivePublicKey(session1AlicePrivate);

const session1BobPrivate = new Uint8Array(32);
crypto.getRandomValues(session1BobPrivate);
const session1BobPublic = P256.derivePublicKey(session1BobPrivate);

const session1Secret = P256.ecdh(session1AlicePrivate, session1BobPublic);

// Session 2 (new ephemeral keys)
const session2AlicePrivate = new Uint8Array(32);
crypto.getRandomValues(session2AlicePrivate);
const session2AlicePublic = P256.derivePublicKey(session2AlicePrivate);

const session2BobPrivate = new Uint8Array(32);
crypto.getRandomValues(session2BobPrivate);
const session2BobPublic = P256.derivePublicKey(session2BobPrivate);

const session2Secret = P256.ecdh(session2AlicePrivate, session2BobPublic);

const sessionSecretsMatch =
	Hex.fromBytes(session1Secret) === Hex.fromBytes(session2Secret);

const clientPrivate = new Uint8Array(32);
crypto.getRandomValues(clientPrivate);
const clientPublic = P256.derivePublicKey(clientPrivate);

const serverPrivate = new Uint8Array(32);
crypto.getRandomValues(serverPrivate);
const serverPublic = P256.derivePublicKey(serverPrivate);
const tlsSharedSecret = P256.ecdh(clientPrivate, serverPublic);
const handshakeSecret = SHA256.hash(tlsSharedSecret);

// Carol joins the conversation
const carolPrivate = new Uint8Array(32);
crypto.getRandomValues(carolPrivate);
const carolPublic = P256.derivePublicKey(carolPrivate);

// Alice-Bob shared secret
const aliceBobSecret = P256.ecdh(alicePrivate, bobPublic);

// Alice-Carol shared secret
const aliceCarolSecret = P256.ecdh(alicePrivate, carolPublic);

// Bob-Carol shared secret
const bobCarolSecret = P256.ecdh(bobPrivate, carolPublic);
