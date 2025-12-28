import { Signature } from "voltaire";
import { Hash } from "voltaire";

// Create a signature
const r = Hash.from(
	"0x88ff6cf0fefd94db46111149ae4bfc179e9b94721fffd821d38d16464b3f71d0",
);
const s = Hash.from(
	"0x45e0aff800961cfce805daef7016b9b675c137a6a41a548f7b60a3484c06a33a",
);
const v = 28;

const sig = Signature.fromSecp256k1(r, s, v);

// Get each component
const extractedR = Signature.getR(sig);
const extractedS = Signature.getS(sig);
const extractedV = Signature.getV(sig);
