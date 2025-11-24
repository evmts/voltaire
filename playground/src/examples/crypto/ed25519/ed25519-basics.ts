// Ed25519 basics: key generation, signing, and verification
import * as Ed25519 from "../../../crypto/Ed25519/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Generate random seed (32 bytes)
const seed = crypto.getRandomValues(new Uint8Array(32));

// Generate keypair from seed (deterministic)
const keypair = Ed25519.keypairFromSeed(seed);

// Sign a message
const message = new TextEncoder().encode("Hello, Ed25519!");
const signature = Ed25519.sign(message, keypair.secretKey);

// Verify signature
const isValid = Ed25519.verify(signature, message, keypair.publicKey);

// Test with wrong message
const wrongMessage = new TextEncoder().encode("Wrong message");
const wrongVerify = Ed25519.verify(signature, wrongMessage, keypair.publicKey);

// Test deterministic key generation
const keypair2 = Ed25519.keypairFromSeed(seed);
const signaturesMatch =
	Hex.fromBytes(keypair.publicKey).toString() ===
	Hex.fromBytes(keypair2.publicKey).toString();
