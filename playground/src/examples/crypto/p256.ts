import { Bytes, Hash, Hex, P256 } from "@tevm/voltaire";

// P-256 (secp256r1) - WebAuthn, Secure Enclave, passkeys

// Generate random private key (32 bytes)
const privateKey = Bytes.random(32);
console.log("Private key:", Hex.fromBytes(privateKey));

// Derive public key (65 bytes uncompressed)
const publicKey = P256.derivePublicKey(privateKey);
console.log("Public key:", Hex.fromBytes(publicKey));

// Sign a message hash (must be 32 bytes)
const message = "Hello, WebAuthn!";
const messageHash = Hash.keccak256String(message);
const signature = P256.sign(messageHash, privateKey);
console.log("Signature r:", Hex.fromBytes(signature.r));
console.log("Signature s:", Hex.fromBytes(signature.s));

// Verify signature
const isValid = P256.verify(signature, messageHash, publicKey);
console.log("Signature valid:", isValid);

// Verification fails with wrong message
const wrongHash = Hash.keccak256String("Wrong message");
const wrongVerify = P256.verify(signature, wrongHash, publicKey);
console.log("Wrong message verify:", wrongVerify);

// ECDH key exchange
const privateKey2 = Bytes.random(32);
const publicKey2 = P256.derivePublicKey(privateKey2);

// Both parties compute same shared secret
const sharedSecret1 = P256.ecdh(privateKey, publicKey2);
const sharedSecret2 = P256.ecdh(privateKey2, publicKey);
const ecdhMatches =
	Hex.fromBytes(sharedSecret1) === Hex.fromBytes(sharedSecret2);
console.log("ECDH shared secrets match:", ecdhMatches);

// Validate private key
P256.validatePrivateKey(privateKey);
console.log("Private key validation passed");

// Validate public key (on curve check)
P256.validatePublicKey(publicKey);
console.log("Public key validation passed");

// WebAuthn/Passkey use case
// User authenticates with biometrics, device signs challenge with P-256
const challenge = Bytes.random(32);
const challengeSignature = P256.sign(challenge, privateKey);
const challengeValid = P256.verify(challengeSignature, challenge, publicKey);
console.log("WebAuthn challenge valid:", challengeValid);
