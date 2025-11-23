// Validate signatures
import * as Secp256k1 from "../../../crypto/Secp256k1/index.js";
import * as Hash from "../../../primitives/Hash/index.js";

// Valid signature
const messageHash = Hash.keccak256String("Test message");
const privateKey = Secp256k1.PrivateKey.random();
const validSig = Secp256k1.sign(messageHash, privateKey);
console.log("Valid signature:");
console.log("  r length:", validSig.r.length);
console.log("  s length:", validSig.s.length);
console.log("  yParity:", validSig.yParity);
console.log("  Is valid:", Secp256k1.isValidSignature(validSig));

// Invalid: wrong r length
const wrongRLength = {
	r: new Uint8Array(16),
	s: validSig.s,
	yParity: validSig.yParity,
};
console.log(
	"\nWrong r length (16 bytes):",
	Secp256k1.isValidSignature(wrongRLength),
);

// Invalid: wrong s length
const wrongSLength = {
	r: validSig.r,
	s: new Uint8Array(16),
	yParity: validSig.yParity,
};
console.log(
	"Wrong s length (16 bytes):",
	Secp256k1.isValidSignature(wrongSLength),
);

// Invalid: r is zero
const zeroR = {
	r: new Uint8Array(32),
	s: validSig.s,
	yParity: validSig.yParity,
};
console.log("Zero r:", Secp256k1.isValidSignature(zeroR));

// Invalid: s is zero
const zeroS = {
	r: validSig.r,
	s: new Uint8Array(32),
	yParity: validSig.yParity,
};
console.log("Zero s:", Secp256k1.isValidSignature(zeroS));

// Invalid: yParity not 0 or 1
const invalidYParity = {
	r: validSig.r,
	s: validSig.s,
	yParity: 2,
};
console.log("Invalid yParity (2):", Secp256k1.isValidSignature(invalidYParity));
