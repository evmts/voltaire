// Generate X25519 keypairs
import * as X25519 from "../../../crypto/X25519/index.js";
import * as Hex from "../../../primitives/Hex/index.js";
const keypair1 = X25519.generateKeypair();

const keypair2 = X25519.generateKeypair();
const seed = new Uint8Array(32);
for (let i = 0; i < 32; i++) seed[i] = i;

const deterministicKeypair = X25519.keypairFromSeed(seed);

// Verify determinism
const sameKeypair = X25519.keypairFromSeed(seed);
const secretsMatch =
	deterministicKeypair.secretKey.every(
		(byte, i) => byte === sameKeypair.secretKey[i],
	) &&
	deterministicKeypair.publicKey.every(
		(byte, i) => byte === sameKeypair.publicKey[i],
	);
const secretKey = X25519.generateSecretKey();
