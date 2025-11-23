// Elliptic curve point addition
import * as Secp256k1 from "../../../crypto/Secp256k1/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Generate two public keys (points on curve)
const privateKey1 = Secp256k1.PrivateKey.random();
const publicKey1 = Secp256k1.derivePublicKey(privateKey1);
console.log("Point 1:", Hex.from(publicKey1).toString().slice(0, 40) + "...");

const privateKey2 = Secp256k1.PrivateKey.random();
const publicKey2 = Secp256k1.derivePublicKey(privateKey2);
console.log("Point 2:", Hex.from(publicKey2).toString().slice(0, 40) + "...");

// Add two points: P1 + P2
const sum = Secp256k1.addPoints(publicKey1, publicKey2);
console.log("\nSum (P1 + P2):", Hex.from(sum).toString().slice(0, 40) + "...");
console.log("Result length:", sum.length, "bytes");

// Verify result is valid point on curve
const isValid = Secp256k1.isValidPublicKey(sum);
console.log("Result is valid point:", isValid);

// Add point to itself (point doubling)
const doubled = Secp256k1.addPoints(publicKey1, publicKey1);
console.log(
	"\nDoubled (P1 + P1):",
	Hex.from(doubled).toString().slice(0, 40) + "...",
);
console.log("Doubled is valid point:", Secp256k1.isValidPublicKey(doubled));
