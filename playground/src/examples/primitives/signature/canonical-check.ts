import { Signature } from "@tevm/voltaire";
import { Hash } from "@tevm/voltaire";

// Canonical signature (low s value)
const canonicalR = Hash(
	"0x88ff6cf0fefd94db46111149ae4bfc179e9b94721fffd821d38d16464b3f71d0",
);
const canonicalS = Hash(
	"0x45e0aff800961cfce805daef7016b9b675c137a6a41a548f7b60a3484c06a33a",
);
const canonicalSig = Signature.fromSecp256k1(canonicalR, canonicalS, 28);

// Create potentially non-canonical signature (high s value)
// Note: In practice, most wallets produce canonical signatures
const highS = Hash(
	"0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364140",
);
const nonCanonicalSig = Signature.fromSecp256k1(canonicalR, highS, 27);

// Normalize to canonical form
const normalized = Signature.normalize(nonCanonicalSig);
