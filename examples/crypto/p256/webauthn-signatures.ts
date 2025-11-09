import * as P256 from "../../../src/crypto/P256/index.js";
import { SHA256 } from "../../../src/crypto/SHA256/index.js";
import { Hex } from "../../../src/primitives/Hex/index.js";

// Simulate authenticator generating keypair
const authenticatorPrivateKey = new Uint8Array(32);
crypto.getRandomValues(authenticatorPrivateKey);

const authenticatorPublicKey = P256.derivePublicKey(authenticatorPrivateKey);

// Authenticator data (37+ bytes)
// Contains RP ID hash (32 bytes) + flags (1 byte) + counter (4 bytes)
const rpIdHash = SHA256.hash(new TextEncoder().encode("example.com"));
const flags = new Uint8Array([0x05]); // User present + User verified
const signCount = new Uint8Array([0x00, 0x00, 0x00, 0x01]); // Counter = 1

const authenticatorData = new Uint8Array([...rpIdHash, ...flags, ...signCount]);

const challenge = new Uint8Array(32);
crypto.getRandomValues(challenge);

const clientDataJSON = JSON.stringify({
	type: "webauthn.get",
	challenge: btoa(String.fromCharCode(...challenge)),
	origin: "https://example.com",
	crossOrigin: false,
});

const clientDataHash = SHA256.hash(new TextEncoder().encode(clientDataJSON));

// WebAuthn signs: authenticatorData || hash(clientDataJSON)
const signedData = new Uint8Array([...authenticatorData, ...clientDataHash]);

// Hash the signed data (WebAuthn uses SHA-256, not Keccak)
const signatureHash = SHA256.hash(signedData);

// Authenticator signs with P-256
const signature = P256.sign(signatureHash, authenticatorPrivateKey);

// Verify signature
const isValid = P256.verify(signature, signatureHash, authenticatorPublicKey);

// Simulate Ethereum transaction signing with passkey
const txHash = SHA256.hash(
	new TextEncoder().encode("Transfer 1 ETH to 0x123..."),
);
const passkeySignature = P256.sign(txHash, authenticatorPrivateKey);
