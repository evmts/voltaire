import * as Hash from "../../../primitives/Hash/index.js";
import * as Signature from "../../../primitives/Signature/index.js";

// 1. secp256k1 (Ethereum/Bitcoin)
const secp256k1R = Hash.from(
	"0x88ff6cf0fefd94db46111149ae4bfc179e9b94721fffd821d38d16464b3f71d0",
);
const secp256k1S = Hash.from(
	"0x45e0aff800961cfce805daef7016b9b675c137a6a41a548f7b60a3484c06a33a",
);
const secp256k1Sig = Signature.fromSecp256k1(secp256k1R, secp256k1S, 28);

// 2. P-256 (NIST P-256, also known as secp256r1)
const p256R = Hash.from(
	"0x4c5b2c1b8e7d3a4f5e6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f",
);
const p256S = Hash.from(
	"0x8f7e6d5c4b3a29180f1e2d3c4b5a69780f1e2d3c4b5a69780f1e2d3c4b5a6978",
);
const p256Sig = Signature.fromP256(p256R, p256S);

// 3. Ed25519 (Edwards curve)
const ed25519Bytes = new Uint8Array(64);
// Fill with example data
for (let i = 0; i < 64; i++) {
	ed25519Bytes[i] = (i * 3) % 256;
}
const ed25519Sig = Signature.fromEd25519(ed25519Bytes);
