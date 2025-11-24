import * as Hash from "../../../primitives/Hash/index.js";
import * as Signature from "../../../primitives/Signature/index.js";

// Create signature
const r = Hash.from(
	"0x88ff6cf0fefd94db46111149ae4bfc179e9b94721fffd821d38d16464b3f71d0",
);
const s = Hash.from(
	"0x45e0aff800961cfce805daef7016b9b675c137a6a41a548f7b60a3484c06a33a",
);
const sig = Signature.fromSecp256k1(r, s, 28);

// Convert to DER format
const derEncoded = Signature.toDER(sig);
// Show DER as hex string directly (it's variable length, not 32 bytes)
const derHex = `0x${Array.from(derEncoded)
	.map((b) => b.toString(16).padStart(2, "0"))
	.join("")}`;

// Parse DER back to signature
const fromDer = Signature.fromDER(derEncoded, "secp256k1", 28);
