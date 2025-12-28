import { Signature } from "voltaire";
import { Hash } from "voltaire";

// Create signature with v = 28 (yParity = 1)
const r1 = Hash.from(
	"0x88ff6cf0fefd94db46111149ae4bfc179e9b94721fffd821d38d16464b3f71d0",
);
const s1 = Hash.from(
	"0x45e0aff800961cfce805daef7016b9b675c137a6a41a548f7b60a3484c06a33a",
);
const sig1 = Signature.fromSecp256k1(r1, s1, 28);

const compact1 = Signature.toCompact(sig1);

// Create signature with v = 27 (yParity = 0)
const r2 = Hash.from(
	"0x9242685bf161793cc25603c231bc2f568eb630ea16aa137d2664ac8038825608",
);
const s2 = Hash.from(
	"0x4f8ae3bd7535248d0bd448298cc2e2071e56992d0774dc340c368ae950852ada",
);
const sig2 = Signature.fromSecp256k1(r2, s2, 27);
const compact2 = Signature.toCompact(sig2);
const recovered = Signature.fromCompact(compact1);

const recompact = Signature.toCompact(recovered);
