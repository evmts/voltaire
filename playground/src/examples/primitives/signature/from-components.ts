import * as Hash from "../../../primitives/Hash/index.js";
import * as Signature from "../../../primitives/Signature/index.js";

// Real signature from Ethereum mainnet
// Transaction: 0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060
const r = Hash.from(
	"0x88ff6cf0fefd94db46111149ae4bfc179e9b94721fffd821d38d16464b3f71d0",
);
const s = Hash.from(
	"0x45e0aff800961cfce805daef7016b9b675c137a6a41a548f7b60a3484c06a33a",
);
const v = 28;

// Create secp256k1 signature with v
const sig1 = Signature.fromSecp256k1(r, s, v);

// Create secp256k1 signature without v
const sig2 = Signature.fromSecp256k1(r, s);

// Another signature with v = 27
const r2 = Hash.from(
	"0x9242685bf161793cc25603c231bc2f568eb630ea16aa137d2664ac8038825608",
);
const s2 = Hash.from(
	"0x4f8ae3bd7535248d0bd448298cc2e2071e56992d0774dc340c368ae950852ada",
);
const sig3 = Signature.fromSecp256k1(r2, s2, 27);
