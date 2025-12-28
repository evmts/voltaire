import { PrivateKey, PublicKey } from "voltaire";
import { secp256k1 } from "@noble/curves/secp256k1.js";

// Create a public key
const privateKey = PrivateKey.from(
	"0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",
);
const publicKey = PublicKey.fromPrivateKey(privateKey);
const compressedWithPrefix = secp256k1.getPublicKey(privateKey, true);

// Break down the coordinates
const uncompressedWithPrefix = secp256k1.getPublicKey(privateKey, false);
const uncompressedFromCompressed = secp256k1.getPublicKey(privateKey, false);
const compressedFromUncompressed = secp256k1.getPublicKey(privateKey, true);
