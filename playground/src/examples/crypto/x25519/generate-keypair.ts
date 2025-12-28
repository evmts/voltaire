import { Bytes, Hex, X25519 } from "@tevm/voltaire";
// Generate X25519 keypairs

const keypair1 = X25519.generateKeypair();

const keypair2 = X25519.generateKeypair();
const seed = Bytes(Array.from({ length: 32 }, (_, i) => i));

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
