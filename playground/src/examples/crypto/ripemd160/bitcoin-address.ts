import * as RIPEMD160 from "../../../crypto/RIPEMD160/index.js";
import * as SHA256 from "../../../crypto/SHA256/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Example: Uncompressed public key
const uncompressedPubKey = Hex.fromString(
	"04" +
		"79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798" +
		"483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8",
);

// Step 1: SHA256 hash of public key
const sha256Hash = SHA256.hash(uncompressedPubKey);

// Step 2: RIPEMD160 hash of SHA256 result (hash160)
const hash160 = RIPEMD160.hash(sha256Hash);

// Compressed public key (33 bytes, starts with 02 or 03)
const compressedPubKey = Hex.fromString(
	"02" + "79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
);

const compressedSha = SHA256.hash(compressedPubKey);
const compressedHash160 = RIPEMD160.hash(compressedSha);
