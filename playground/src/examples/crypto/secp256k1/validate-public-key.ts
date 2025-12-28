import { Hex, Secp256k1 } from "voltaire";
// Validate public keys

// Valid public key from private key
const privateKey = Secp256k1.PrivateKey.random();
const validKey = Secp256k1.derivePublicKey(privateKey);

// Invalid: wrong length
const wrongLength = new Uint8Array(32);
wrongLength.fill(0x04);

// Invalid: wrong prefix (should be 0x04 for uncompressed)
const wrongPrefix = new Uint8Array(65);
wrongPrefix[0] = 0x03; // Compressed prefix on uncompressed length
wrongPrefix.fill(0x42, 1);

// Invalid: not on curve
const notOnCurve = new Uint8Array(65);
notOnCurve[0] = 0x04;
notOnCurve.fill(0xff, 1);
