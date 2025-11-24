// Validate signatures
import * as Secp256k1 from "../../../crypto/Secp256k1/index.js";
import * as Hash from "../../../primitives/Hash/index.js";

// Valid signature
const messageHash = Hash.keccak256String("Test message");
const privateKey = Secp256k1.PrivateKey.random();
const validSig = Secp256k1.sign(messageHash, privateKey);

// Invalid: wrong r length
const wrongRLength = {
	r: new Uint8Array(16),
	s: validSig.s,
	yParity: validSig.yParity,
};

// Invalid: wrong s length
const wrongSLength = {
	r: validSig.r,
	s: new Uint8Array(16),
	yParity: validSig.yParity,
};

// Invalid: r is zero
const zeroR = {
	r: new Uint8Array(32),
	s: validSig.s,
	yParity: validSig.yParity,
};

// Invalid: s is zero
const zeroS = {
	r: validSig.r,
	s: new Uint8Array(32),
	yParity: validSig.yParity,
};

// Invalid: yParity not 0 or 1
const invalidYParity = {
	r: validSig.r,
	s: validSig.s,
	yParity: 2,
};
