import { Bytes, Ed25519, Hex } from "@tevm/voltaire";

// Ed25519 - Fast, secure signatures (Solana, SSH, TLS)

// Generate random seed (32 bytes)
const seed = Bytes.random(32);
console.log("Seed:", Hex.fromBytes(seed));

// Generate keypair from seed (deterministic)
const keypair = Ed25519.keypairFromSeed(seed);
console.log("Public key:", Hex.fromBytes(keypair.publicKey));
// publicKey: 32 bytes, secretKey: 64 bytes (seed + pubkey)

// Sign a message (any length, no pre-hashing needed)
const message = new TextEncoder().encode("Hello, Ed25519!");
const signature = Ed25519.sign(message, keypair.secretKey);
console.log("Signature:", Hex.fromBytes(signature));
// Signature is always 64 bytes

// Verify signature
const isValid = Ed25519.verify(signature, message, keypair.publicKey);
console.log("Signature valid:", isValid);

// Verification fails with wrong message
const wrongMessage = new TextEncoder().encode("Wrong message");
const wrongVerify = Ed25519.verify(signature, wrongMessage, keypair.publicKey);
console.log("Wrong message verify:", wrongVerify);

// Deterministic signatures - same seed + message = same signature
const keypair2 = Ed25519.keypairFromSeed(seed);
const signature2 = Ed25519.sign(message, keypair2.secretKey);
const signaturesMatch = Hex.fromBytes(signature) === Hex.fromBytes(signature2);
console.log("Deterministic signatures match:", signaturesMatch);

// Derive public key from secret key
const derivedPubKey = Ed25519.derivePublicKey(keypair.secretKey);
const derivedMatches =
	Hex.fromBytes(keypair.publicKey) === Hex.fromBytes(derivedPubKey);
console.log("Derived public key matches:", derivedMatches);

// Validate keys
Ed25519.validatePublicKey(keypair.publicKey);
console.log("Public key validation passed");

// Sign binary data
const binaryData = Bytes([0x00, 0xff, 0x55, 0xaa]);
const binarySig = Ed25519.sign(binaryData, keypair.secretKey);
console.log("Binary signature:", Hex.fromBytes(binarySig));
