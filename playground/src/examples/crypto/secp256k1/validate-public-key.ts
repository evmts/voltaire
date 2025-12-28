import { Bytes, Hex, Secp256k1 } from "@tevm/voltaire";
// Validate public keys

// Valid public key from private key
const privateKey = Secp256k1.PrivateKey.random();
const validKey = Secp256k1.derivePublicKey(privateKey);

// Invalid: wrong length
const wrongLength = Bytes(Array(32).fill(0x04));

// Invalid: wrong prefix (should be 0x04 for uncompressed)
const wrongPrefix = Bytes([0x03, ...Array(64).fill(0x42)]);

// Invalid: not on curve
const notOnCurve = Bytes([0x04, ...Array(64).fill(0xff)]);
