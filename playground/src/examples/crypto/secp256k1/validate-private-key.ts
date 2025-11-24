// Validate private keys
import * as Secp256k1 from "../../../crypto/Secp256k1/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Valid random private key
const validKey = Secp256k1.PrivateKey.random();

// Invalid: all zeros
const zeros = new Uint8Array(32);

// Invalid: exceeds curve order
const tooLarge = new Uint8Array(32);
tooLarge.fill(0xff);

// Invalid: wrong length
const wrongLength = new Uint8Array(16);
wrongLength.fill(0x42);

// Valid: close to curve order but below it
const nearOrder = new Uint8Array([
	0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
	0xff, 0xff, 0xfe, 0xba, 0xae, 0xdc, 0xe6, 0xaf, 0x48, 0xa0, 0x3b, 0xbf, 0xd2,
	0x5e, 0x8c, 0xd0, 0x36, 0x41, 0x40,
]);
