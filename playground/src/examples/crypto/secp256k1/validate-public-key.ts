// Validate public keys
import * as Secp256k1 from "../../../crypto/Secp256k1/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Valid public key from private key
const privateKey = Secp256k1.PrivateKey.random();
const validKey = Secp256k1.derivePublicKey(privateKey);
console.log(
	"Valid public key (uncompressed):",
	Hex.from(validKey).toString().slice(0, 40) + "...",
);
console.log("Length:", validKey.length, "bytes");
console.log("Is valid:", Secp256k1.isValidPublicKey(validKey));

// Invalid: wrong length
const wrongLength = new Uint8Array(32);
wrongLength.fill(0x04);
console.log("\nWrong length (32 bytes):", Hex.from(wrongLength).toString());
console.log("Is valid:", Secp256k1.isValidPublicKey(wrongLength));

// Invalid: wrong prefix (should be 0x04 for uncompressed)
const wrongPrefix = new Uint8Array(65);
wrongPrefix[0] = 0x03; // Compressed prefix on uncompressed length
wrongPrefix.fill(0x42, 1);
console.log(
	"\nWrong prefix (0x03):",
	Hex.from(wrongPrefix).toString().slice(0, 20) + "...",
);
console.log("Is valid:", Secp256k1.isValidPublicKey(wrongPrefix));

// Invalid: not on curve
const notOnCurve = new Uint8Array(65);
notOnCurve[0] = 0x04;
notOnCurve.fill(0xff, 1);
console.log(
	"\nNot on curve:",
	Hex.from(notOnCurve).toString().slice(0, 20) + "...",
);
console.log("Is valid:", Secp256k1.isValidPublicKey(notOnCurve));
