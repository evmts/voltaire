import { Ed25519, Hex } from "voltaire";
// Generate Ed25519 keypair

// Generate random seed (32 bytes)
const seed = crypto.getRandomValues(new Uint8Array(32));

// Generate keypair from seed (deterministic)
const keypair = Ed25519.keypairFromSeed(seed);

// Validate keys
const secretValid = Ed25519.validateSecretKey(keypair.secretKey);
const publicValid = Ed25519.validatePublicKey(keypair.publicKey);

// Regenerate keypair from same seed (deterministic)
const keypair2 = Ed25519.keypairFromSeed(seed);
const keysMatch =
	Hex.fromBytes(keypair.publicKey).toString() ===
	Hex.fromBytes(keypair2.publicKey).toString();
