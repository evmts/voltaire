import { Bytes, Hash, Hex, P256 } from "@tevm/voltaire";

// P-256 (secp256r1) - WebAuthn, Secure Enclave, passkeys

// Generate random private key (32 bytes)
const privateKey = Bytes.random(32);

// Derive public key (65 bytes uncompressed)
const publicKey = P256.derivePublicKey(privateKey);

// Sign a message hash (must be 32 bytes)
const message = "Hello, WebAuthn!";
const messageHash = Hash.keccak256String(message);
const signature = P256.sign(messageHash, privateKey);

// Verify signature
const isValid = P256.verify(signature, messageHash, publicKey);

// Verification fails with wrong message
const wrongHash = Hash.keccak256String("Wrong message");
const wrongVerify = P256.verify(signature, wrongHash, publicKey);

// ECDH key exchange
const privateKey2 = Bytes.random(32);
const publicKey2 = P256.derivePublicKey(privateKey2);

// Both parties compute same shared secret
const sharedSecret1 = P256.ecdh(privateKey, publicKey2);
const sharedSecret2 = P256.ecdh(privateKey2, publicKey);
const ecdhMatches =
	Hex.fromBytes(sharedSecret1) === Hex.fromBytes(sharedSecret2);

// Validate private key
try {
	P256.validatePrivateKey(privateKey);
} catch (e) {
	// Invalid private key
}

// Validate public key (on curve check)
try {
	P256.validatePublicKey(publicKey);
} catch (e) {
	// Invalid public key
}

// WebAuthn/Passkey use case
// User authenticates with biometrics, device signs challenge with P-256
const challenge = Bytes.random(32);
const challengeSignature = P256.sign(challenge, privateKey);
const challengeValid = P256.verify(challengeSignature, challenge, publicKey);
