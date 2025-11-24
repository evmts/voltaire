// Sign message with Ed25519
import * as Ed25519 from "../../../crypto/Ed25519/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Generate keypair
const seed = crypto.getRandomValues(new Uint8Array(32));
const keypair = Ed25519.keypairFromSeed(seed);

// Sign a message (no pre-hashing needed)
const message = new TextEncoder().encode("Hello, Ed25519!");
const signature = Ed25519.sign(message, keypair.secretKey);

// Ed25519 signatures are deterministic
const signature2 = Ed25519.sign(message, keypair.secretKey);
const signaturesMatch =
	Hex.fromBytes(signature).toString() === Hex.fromBytes(signature2).toString();

// Sign empty message
const emptyMessage = new Uint8Array(0);
const emptySignature = Ed25519.sign(emptyMessage, keypair.secretKey);

// Sign large message
const largeMessage = new Uint8Array(10000).fill(0x42);
const largeSignature = Ed25519.sign(largeMessage, keypair.secretKey);
