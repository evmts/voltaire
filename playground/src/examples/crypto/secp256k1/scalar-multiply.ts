import { Hex, Secp256k1 } from "voltaire";
// Scalar multiplication on elliptic curve

// Generate public key (point on curve)
const privateKey = Secp256k1.PrivateKey.random();
const publicKey = Secp256k1.derivePublicKey(privateKey);

// Scalar (32-byte number)
const scalar = new Uint8Array(32);
scalar[31] = 3; // Small scalar for demonstration

// Multiply point by scalar: scalar * P
const result = Secp256k1.scalarMultiply(publicKey, scalar);

// Multiplying by 1 returns same point
const one = new Uint8Array(32);
one[31] = 1;
const times1 = Secp256k1.scalarMultiply(publicKey, one);
const sameAsOriginal = publicKey.every((b, i) => b === times1[i]);

// Multiplying by 2 (point doubling via scalar)
const two = new Uint8Array(32);
two[31] = 2;
const times2 = Secp256k1.scalarMultiply(publicKey, two);
const doubled = Secp256k1.addPoints(publicKey, publicKey);
const doublingMatches = times2.every((b, i) => b === doubled[i]);
