import * as Hash from "../../../primitives/Hash/index.js";
import * as Signature from "../../../primitives/Signature/index.js";

// Real signature from Ethereum mainnet transaction
// Transaction hash: 0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060
// From: 0x4bbeEB066eD09B7AEd07bF39EEe0460DFa261520
// To: 0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359
// Value: 0.31729 ETH

const txSignature = {
	r: "0x88ff6cf0fefd94db46111149ae4bfc179e9b94721fffd821d38d16464b3f71d0",
	s: "0x45e0aff800961cfce805daef7016b9b675c137a6a41a548f7b60a3484c06a33a",
	v: 28,
};

// Create signature from components
const r = Hash.from(txSignature.r);
const s = Hash.from(txSignature.s);
const sig = Signature.fromSecp256k1(r, s, txSignature.v);
const bytes = Signature.toBytes(sig);

const compact = Signature.toCompact(sig);
const recoveryId = Signature.getV(sig);
const yParity = recoveryId !== undefined ? recoveryId - 27 : undefined;
