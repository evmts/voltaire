import * as Ed25519 from "../../../src/crypto/Ed25519/index.js";
import { Hex } from "../../../src/primitives/Hex/index.js";

// Generate 32-byte seed (in production, use crypto.getRandomValues())
const seedBytes = new Uint8Array(32);
crypto.getRandomValues(seedBytes);
const seed = Hex.fromBytes(seedBytes);

const keypair = Ed25519.keypairFromSeed(seed);

const message = new TextEncoder().encode("Hello, Ed25519!");

const signature = Ed25519.sign(message, keypair.secretKey);

const isValid = Ed25519.verify(signature, message, keypair.publicKey);

// Wrong message fails
const wrongMessage = new TextEncoder().encode("Wrong message");
const isInvalid = Ed25519.verify(signature, wrongMessage, keypair.publicKey);

// Wrong public key fails
const wrongSeedBytes = new Uint8Array(32).fill(0x42);
const wrongSeed = Hex.fromBytes(wrongSeedBytes);
const wrongKeypair = Ed25519.keypairFromSeed(wrongSeed as any);
const wrongKey = Ed25519.verify(signature, message, wrongKeypair.publicKey);

const testMessage = new TextEncoder().encode("test");

// Sign same message multiple times
const sig1 = Ed25519.sign(testMessage, keypair.secretKey);
const sig2 = Ed25519.sign(testMessage, keypair.secretKey);
const sig3 = Ed25519.sign(testMessage, keypair.secretKey);

const allMatch =
	Hex.fromBytes(sig1) === Hex.fromBytes(sig2) &&
	Hex.fromBytes(sig2) === Hex.fromBytes(sig3);

// Empty message
const empty = new Uint8Array(0);
const sigEmpty = Ed25519.sign(empty, keypair.secretKey);

// Short message
const short = new TextEncoder().encode("Hi");
const sigShort = Ed25519.sign(short, keypair.secretKey);

// Long message
const long = new Uint8Array(10000).fill(0xab);
const sigLong = Ed25519.sign(long, keypair.secretKey);

// Invalid keys - these would fail validation but showing the pattern
const invalidShort = Hex("0x" + "ab".repeat(16));
const invalidLong = Hex("0x" + "ab".repeat(64));

const derivedPublicKey = Ed25519.derivePublicKey(keypair.secretKey);

const keysMatch =
	Hex.fromBytes(keypair.publicKey) === Hex.fromBytes(derivedPublicKey);

const messages = ["First message", "Second message", "Third message"];

messages.forEach((msg, i) => {
	const msgBytes = new TextEncoder().encode(msg);
	const sig = Ed25519.sign(msgBytes, keypair.secretKey);
	const valid = Ed25519.verify(sig, msgBytes, keypair.publicKey);
});
