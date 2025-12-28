// Primitives examples - imported as raw strings
// These demonstrate the Voltaire primitives API

import address from "./primitives/address.ts?raw";
import hex from "./primitives/hex.ts?raw";
import hash from "./primitives/hash.ts?raw";
import uint256 from "./primitives/uint256.ts?raw";
import rlp from "./primitives/rlp.ts?raw";
import transaction from "./primitives/transaction.ts?raw";
import accesslist from "./primitives/accesslist.ts?raw";
import blob from "./primitives/blob.ts?raw";
import denomination from "./primitives/denomination.ts?raw";
import bytes from "./primitives/bytes.ts?raw";

export const primitiveExamples: Record<string, string> = {
	"address.ts": address,
	"hex.ts": hex,
	"hash.ts": hash,
	"uint256.ts": uint256,
	"rlp.ts": rlp,
	"transaction.ts": transaction,
	"accesslist.ts": accesslist,
	"blob.ts": blob,
	"denomination.ts": denomination,
	"bytes.ts": bytes,
};
