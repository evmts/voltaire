import * as P256 from "../../../crypto/P256/index.js";

// Generate random private key
const privateKey = crypto.getRandomValues(
	new Uint8Array(P256.PRIVATE_KEY_SIZE),
);

// Derive public key (uncompressed format: x || y)
const publicKey = P256.derivePublicKey(privateKey);

// Extract coordinates
const xCoord = publicKey.slice(0, 32);
const yCoord = publicKey.slice(32, 64);
try {
	P256.validatePrivateKey(privateKey);
} catch (e) {}

try {
	P256.validatePublicKey(publicKey);
} catch (e) {}
// Verify deterministic public key derivation
const publicKey2 = P256.derivePublicKey(privateKey);
