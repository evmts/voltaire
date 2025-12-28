import { Ed25519, Hash, Hex, Secp256k1 } from "voltaire";
// Compare Ed25519 with secp256k1

// Ed25519 key generation
const ed25519Seed = crypto.getRandomValues(new Uint8Array(32));
const ed25519Keypair = Ed25519.keypairFromSeed(ed25519Seed);

// secp256k1 key generation
const secp256k1PrivateKey = crypto.getRandomValues(new Uint8Array(32));
const secp256k1PublicKey = Secp256k1.derivePublicKey(secp256k1PrivateKey);

// Ed25519 signing
const message = new TextEncoder().encode("Test message");
const ed25519Signature = Ed25519.sign(message, ed25519Keypair.secretKey);

// secp256k1 signing (requires pre-hashed message)
const messageHash = Hash.keccak256(message);
const secp256k1Signature = Secp256k1.sign(messageHash, secp256k1PrivateKey);
const ed25519Signature2 = Ed25519.sign(message, ed25519Keypair.secretKey);
const secp256k1Signature2 = Secp256k1.sign(messageHash, secp256k1PrivateKey);

const ed25519Deterministic =
	Hex.fromBytes(ed25519Signature).toString() ===
	Hex.fromBytes(ed25519Signature2).toString();
const secp256k1Deterministic =
	Hex.fromBytes(secp256k1Signature.r).toString() ===
		Hex.fromBytes(secp256k1Signature2.r).toString() &&
	Hex.fromBytes(secp256k1Signature.s).toString() ===
		Hex.fromBytes(secp256k1Signature2.s).toString();
const ed25519Valid = Ed25519.verify(
	ed25519Signature,
	message,
	ed25519Keypair.publicKey,
);
const secp256k1Valid = Secp256k1.verify(
	secp256k1Signature,
	messageHash,
	secp256k1PublicKey,
);
