// Ed25519 deterministic signatures (no nonce needed)
import * as Ed25519 from "../../../crypto/Ed25519/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Generate keypair
const seed = new Uint8Array(32).fill(1);
const keypair = Ed25519.keypairFromSeed(seed);

// Sign same message multiple times
const message = new TextEncoder().encode("Test message");
const signature1 = Ed25519.sign(message, keypair.secretKey);
const signature2 = Ed25519.sign(message, keypair.secretKey);
const signature3 = Ed25519.sign(message, keypair.secretKey);

const allMatch =
	Hex.fromBytes(signature1).toString() ===
		Hex.fromBytes(signature2).toString() &&
	Hex.fromBytes(signature2).toString() === Hex.fromBytes(signature3).toString();

// Generate keypairs from same seed
const keypair2 = Ed25519.keypairFromSeed(seed);
const keypair3 = Ed25519.keypairFromSeed(seed);

const publicKeysMatch =
	Hex.fromBytes(keypair.publicKey).toString() ===
		Hex.fromBytes(keypair2.publicKey).toString() &&
	Hex.fromBytes(keypair2.publicKey).toString() ===
		Hex.fromBytes(keypair3.publicKey).toString();
const secretKeysMatch =
	Hex.fromBytes(keypair.secretKey).toString() ===
		Hex.fromBytes(keypair2.secretKey).toString() &&
	Hex.fromBytes(keypair2.secretKey).toString() ===
		Hex.fromBytes(keypair3.secretKey).toString();

const seed2 = new Uint8Array(32).fill(2);
const keypair4 = Ed25519.keypairFromSeed(seed2);

const differentPublicKeys =
	Hex.fromBytes(keypair.publicKey).toString() !==
	Hex.fromBytes(keypair4.publicKey).toString();
const differentSecretKeys =
	Hex.fromBytes(keypair.secretKey).toString() !==
	Hex.fromBytes(keypair4.secretKey).toString();
