import { Bytes, Ed25519, Hex } from "@tevm/voltaire";
// Sign message with Ed25519

// Generate keypair
const seed = Bytes.random(32);
const keypair = Ed25519.keypairFromSeed(seed);

// Sign a message (no pre-hashing needed)
const message = new TextEncoder().encode("Hello, Ed25519!");
const signature = Ed25519.sign(message, keypair.secretKey);

// Ed25519 signatures are deterministic
const signature2 = Ed25519.sign(message, keypair.secretKey);
const signaturesMatch =
	Hex.fromBytes(signature).toString() === Hex.fromBytes(signature2).toString();

// Sign empty message
const emptyMessage = Bytes.zero(0);
const emptySignature = Ed25519.sign(emptyMessage, keypair.secretKey);

// Sign large message
const largeMessage = Bytes(Array(10000).fill(0x42));
const largeSignature = Ed25519.sign(largeMessage, keypair.secretKey);
