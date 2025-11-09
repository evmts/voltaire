import * as Ed25519 from "../../../src/crypto/Ed25519/index.js";
import { Hex } from "../../../src/primitives/Hex/index.js";

// Generate seed (equivalent to ssh-keygen -t ed25519)
const seed = new Uint8Array(32);
crypto.getRandomValues(seed);

const keypair = Ed25519.keypairFromSeed(seed);

// Simplified encoding
const algorithmName = new TextEncoder().encode("ssh-ed25519");

// SSH signs the session data
const sessionId = new Uint8Array(32);
crypto.getRandomValues(sessionId);

const message = new TextEncoder().encode("SSH authentication message");

// Combine data (simplified)
const signData = new Uint8Array([...sessionId, ...message]);

const signature = Ed25519.sign(signData, keypair.secretKey);

const isValid = Ed25519.verify(signature, signData, keypair.publicKey);

// SSH fingerprints are SHA-256 hash of public key
const encoder = new TextEncoder();

// Simplified fingerprint (SHA-256 of public key)
// Real SSH includes length-prefixed encoding
const fingerprintData = new Uint8Array([
	...encoder.encode("ssh-ed25519"),
	...keypair.publicKey,
]);

// Generate additional keypairs
const keypair2 = Ed25519.keypairFromSeed(
	crypto.getRandomValues(new Uint8Array(32)),
);
const keypair3 = Ed25519.keypairFromSeed(
	crypto.getRandomValues(new Uint8Array(32)),
);

const commitMessage = new TextEncoder().encode(
	"commit 1234567890abcdef\n" +
		"tree abcdef1234567890\n" +
		"parent 0987654321fedcba\n" +
		"author User <user@example.com> 1234567890 +0000\n" +
		"committer User <user@example.com> 1234567890 +0000\n" +
		"\n" +
		"feat: add new feature",
);

const commitSig = Ed25519.sign(commitMessage, keypair.secretKey);

const verifyCommit = Ed25519.verify(
	commitSig,
	commitMessage,
	keypair.publicKey,
);
