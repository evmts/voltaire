// Scalar multiplication on elliptic curve
import * as Secp256k1 from "../../../crypto/Secp256k1/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Generate public key (point on curve)
const privateKey = Secp256k1.PrivateKey.random();
const publicKey = Secp256k1.derivePublicKey(privateKey);
console.log(
	"Original point:",
	Hex.from(publicKey).toString().slice(0, 40) + "...",
);

// Scalar (32-byte number)
const scalar = new Uint8Array(32);
scalar[31] = 3; // Small scalar for demonstration
console.log("Scalar:", Hex.from(scalar).toString());

// Multiply point by scalar: scalar * P
const result = Secp256k1.scalarMultiply(publicKey, scalar);
console.log(
	"\nResult (3 * P):",
	Hex.from(result).toString().slice(0, 40) + "...",
);
console.log("Result is valid point:", Secp256k1.isValidPublicKey(result));

// Multiplying by 1 returns same point
const one = new Uint8Array(32);
one[31] = 1;
const times1 = Secp256k1.scalarMultiply(publicKey, one);
const sameAsOriginal = publicKey.every((b, i) => b === times1[i]);
console.log("\n1 * P equals P:", sameAsOriginal);

// Multiplying by 2 (point doubling via scalar)
const two = new Uint8Array(32);
two[31] = 2;
const times2 = Secp256k1.scalarMultiply(publicKey, two);
const doubled = Secp256k1.addPoints(publicKey, publicKey);
const doublingMatches = times2.every((b, i) => b === doubled[i]);
console.log("2 * P equals P + P:", doublingMatches);
