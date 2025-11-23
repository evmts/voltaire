import * as RIPEMD160 from "../../../crypto/RIPEMD160/index.js";
import * as SHA256 from "../../../crypto/SHA256/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Bitcoin uses SHA256 + RIPEMD160 for address generation (hash160)
console.log("=== Bitcoin Address Derivation (Simplified) ===\n");

// Example: Uncompressed public key
const uncompressedPubKey = Hex.fromString(
	"04" +
		"79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798" +
		"483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8",
);

// Step 1: SHA256 hash of public key
const sha256Hash = SHA256.hash(uncompressedPubKey);
console.log(
	"Public key (first 20 bytes):",
	Hex.fromBytes(uncompressedPubKey.slice(0, 20)),
);
console.log("SHA256 hash:", Hex.fromBytes(sha256Hash));

// Step 2: RIPEMD160 hash of SHA256 result (hash160)
const hash160 = RIPEMD160.hash(sha256Hash);
console.log("RIPEMD160 hash (hash160):", Hex.fromBytes(hash160));
console.log("Hash160 length:", hash160.length, "bytes");

// This hash160 would then be Base58Check encoded with version byte
// for the final Bitcoin address (not shown)

console.log("\n=== Compressed Public Key ===\n");

// Compressed public key (33 bytes, starts with 02 or 03)
const compressedPubKey = Hex.fromString(
	"02" + "79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
);

const compressedSha = SHA256.hash(compressedPubKey);
const compressedHash160 = RIPEMD160.hash(compressedSha);
console.log("Compressed pubkey:", Hex.fromBytes(compressedPubKey));
console.log("Hash160:", Hex.fromBytes(compressedHash160));

// Compressed vs uncompressed give different addresses
console.log("\nDifferent hash160:", !hash160.equals(compressedHash160));
