import * as P256 from "../../../crypto/P256/index.js";
import { Hash } from "../../../primitives/Hash/index.js";
// Generate a random private key (32 bytes)
const privateKey = crypto.getRandomValues(new Uint8Array(32));

// Derive public key from private key
const publicKey = P256.derivePublicKey(privateKey);
// Sign a message
const message = "Hello, WebAuthn!";
const messageHash = Hash.keccak256String(message);
const signature = P256.sign(messageHash, privateKey);

// Verify the signature
const isValid = P256.verify(signature, messageHash, publicKey);

// Verify with wrong message
const wrongMessageHash = Hash.keccak256String("Wrong message");
const isInvalid = P256.verify(signature, wrongMessageHash, publicKey);
// Create second keypair for ECDH
const privateKey2 = crypto.getRandomValues(new Uint8Array(32));
const publicKey2 = P256.derivePublicKey(privateKey2);

// Compute shared secrets (symmetric)
const sharedSecret1 = P256.ecdh(privateKey, publicKey2);
const sharedSecret2 = P256.ecdh(privateKey2, publicKey);
// Validate keys
try {
	P256.validatePrivateKey(privateKey);
} catch (e) {}

try {
	P256.validatePublicKey(publicKey);
} catch (e) {}
