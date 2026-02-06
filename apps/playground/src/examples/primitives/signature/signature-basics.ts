import { Bytes, Signature } from "@tevm/voltaire";
import { Hash } from "@tevm/voltaire";

// Example: Signature basics covering all core functionality

// Real Ethereum transaction signature components
// From: 0x4bbeEB066eD09B7AEd07bF39EEe0460DFa261520 (Vitalik.eth)
const rHex =
	"0x88ff6cf0fefd94db46111149ae4bfc179e9b94721fffd821d38d16464b3f71d0";
const sHex =
	"0x45e0aff800961cfce805daef7016b9b675c137a6a41a548f7b60a3484c06a33a";
const v = 28;

// 1. Create from secp256k1 components (r, s, v)
const r = Hash(rHex);
const s = Hash(sHex);
const sig1 = Signature.fromSecp256k1(r, s, v);
const rRecovered = Signature.getR(sig1);
const sRecovered = Signature.getS(sig1);
const vRecovered = Signature.getV(sig1);
const bytes = Signature.toBytes(sig1);

// 4. Compact format (EIP-2098)
const compact = Signature.toCompact(sig1);

// 5. From compact format
const fromCompactSig = Signature.fromCompact(compact);
const randomBytes = Bytes.zero(64);
