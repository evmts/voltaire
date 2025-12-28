import { Ed25519 } from "voltaire";
// Verify Ed25519 signature

// Generate keypair and sign
const seed = crypto.getRandomValues(new Uint8Array(32));
const keypair = Ed25519.keypairFromSeed(seed);
const message = new TextEncoder().encode("Verify this message");
const signature = Ed25519.sign(message, keypair.secretKey);

// Verify valid signature
const isValid = Ed25519.verify(signature, message, keypair.publicKey);

// Try with wrong public key
const wrongSeed = crypto.getRandomValues(new Uint8Array(32));
const wrongKeypair = Ed25519.keypairFromSeed(wrongSeed);
const wrongPublicKey = Ed25519.verify(
	signature,
	message,
	wrongKeypair.publicKey,
);

// Try with wrong message
const wrongMessage = new TextEncoder().encode("Different message");
const wrongMessageVerify = Ed25519.verify(
	signature,
	wrongMessage,
	keypair.publicKey,
);

// Try with corrupted signature
const corruptedSignature = new Uint8Array(signature);
corruptedSignature[0] ^= 1;
const corruptedVerify = Ed25519.verify(
	corruptedSignature,
	message,
	keypair.publicKey,
);
