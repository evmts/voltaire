import { Bytes, Hex, X25519 } from "@tevm/voltaire";
// Deriving public keys from secret keys

const secretKey = X25519.generateSecretKey();

// Derive public key
const publicKey = X25519.derivePublicKey(secretKey);
const seed = Bytes.random(32);
const keypair = X25519.keypairFromSeed(seed);

const manuallyDerived = X25519.derivePublicKey(keypair.secretKey);
const keysMatch = keypair.publicKey.every(
	(byte, i) => byte === manuallyDerived[i],
);
const derived1 = X25519.derivePublicKey(secretKey);
const derived2 = X25519.derivePublicKey(secretKey);
const deterministic = derived1.every((byte, i) => byte === derived2[i]);
const testSecret = X25519.generateSecretKey();
const derivedPub = X25519.derivePublicKey(testSecret);

// Manually multiply by base point (9)
const basePoint = Bytes([9, ...Array(31).fill(0)]);
const baseMult = X25519.scalarmult(testSecret, basePoint);

const matchesBasePoint = derivedPub.every((byte, i) => byte === baseMult[i]);
