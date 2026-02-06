import { Bytes, Ed25519, Hex } from "@tevm/voltaire";
// Derive Ed25519 public key from secret key

// Generate keypair from seed
const seed = Bytes.random(32);
const keypair = Ed25519.keypairFromSeed(seed);

// Derive public key from secret key
const derivedPublicKey = Ed25519.derivePublicKey(keypair.secretKey);

// Verify they match
const keysMatch =
	Hex.fromBytes(keypair.publicKey).toString() ===
	Hex.fromBytes(derivedPublicKey).toString();

// Public key derivation is deterministic
const derivedPublicKey2 = Ed25519.derivePublicKey(keypair.secretKey);
const derivedMatch =
	Hex.fromBytes(derivedPublicKey).toString() ===
	Hex.fromBytes(derivedPublicKey2).toString();

// Use derived public key for verification
const message = new TextEncoder().encode("Test message");
const signature = Ed25519.sign(message, keypair.secretKey);
const verifyOriginal = Ed25519.verify(signature, message, keypair.publicKey);
const verifyDerived = Ed25519.verify(signature, message, derivedPublicKey);
