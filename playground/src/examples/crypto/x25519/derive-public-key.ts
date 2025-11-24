// Deriving public keys from secret keys
import * as X25519 from "../../../crypto/X25519/index.js";
import * as Hex from "../../../primitives/Hex/index.js";
const secretKey = X25519.generateSecretKey();

// Derive public key
const publicKey = X25519.derivePublicKey(secretKey);
const seed = new Uint8Array(32);
crypto.getRandomValues(seed);
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
const basePoint = new Uint8Array(32);
basePoint[0] = 9;
const baseMult = X25519.scalarmult(testSecret, basePoint);

const matchesBasePoint = derivedPub.every((byte, i) => byte === baseMult[i]);
