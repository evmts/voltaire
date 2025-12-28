import { Hex, Secp256k1 } from "voltaire";
// Elliptic curve point addition

// Generate two public keys (points on curve)
const privateKey1 = Secp256k1.PrivateKey.random();
const publicKey1 = Secp256k1.derivePublicKey(privateKey1);

const privateKey2 = Secp256k1.PrivateKey.random();
const publicKey2 = Secp256k1.derivePublicKey(privateKey2);

// Add two points: P1 + P2
const sum = Secp256k1.addPoints(publicKey1, publicKey2);

// Verify result is valid point on curve
const isValid = Secp256k1.isValidPublicKey(sum);

// Add point to itself (point doubling)
const doubled = Secp256k1.addPoints(publicKey1, publicKey1);
