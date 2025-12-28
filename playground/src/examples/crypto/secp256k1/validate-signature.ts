import { Bytes, Hash, Secp256k1 } from "@tevm/voltaire";
// Validate signatures

// Valid signature
const messageHash = Hash.keccak256String("Test message");
const privateKey = Secp256k1.PrivateKey.random();
const validSig = Secp256k1.sign(messageHash, privateKey);

// Invalid: wrong r length
const wrongRLength = {
	r: Bytes.zero(16),
	s: validSig.s,
	yParity: validSig.yParity,
};

// Invalid: wrong s length
const wrongSLength = {
	r: validSig.r,
	s: Bytes.zero(16),
	yParity: validSig.yParity,
};

// Invalid: r is zero
const zeroR = {
	r: Bytes.zero(32),
	s: validSig.s,
	yParity: validSig.yParity,
};

// Invalid: s is zero
const zeroS = {
	r: validSig.r,
	s: Bytes.zero(32),
	yParity: validSig.yParity,
};

// Invalid: yParity not 0 or 1
const invalidYParity = {
	r: validSig.r,
	s: validSig.s,
	yParity: 2,
};
