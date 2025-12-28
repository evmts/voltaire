import { TransactionHash, Bytes } from "@tevm/voltaire";
// Example: TransactionHash basics

// Create from hex string (most common)
const hash1 = TransactionHash(
	"0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b",
);
const hash2 = TransactionHash.fromHex(
	"0xb3b20624f8f0f86eb50dd04688409e5cea4bd02d700bf6e79e9384d47d6a5a35",
);

// Create from bytes
const bytes = Bytes([
	0x5c, 0x50, 0x4e, 0xd4, 0x32, 0xcb, 0x51, 0x13, 0x8b, 0xcf, 0x09, 0xb6, 0x04,
	0xd6, 0xc1, 0x57, 0x9d, 0x69, 0x83, 0xe5, 0x27, 0x61, 0x05, 0xca, 0x7e, 0x64,
	0xdb, 0x49, 0x5b, 0x41, 0x4c, 0x64,
]);
const hash3 = TransactionHash.fromBytes(bytes);
const sameHash = TransactionHash(
	"0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b",
);

// First Ethereum transaction
const firstTx = TransactionHash(
	"0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060",
);

// DAO hack transaction
const daoHack = TransactionHash(
	"0x0ec3f2488a93839524add10ea229e773f6bc891b4eb4794c3337d4495263790b",
);

// First EIP-1559 transaction (London fork)
const firstEip1559 = TransactionHash(
	"0x1bb4add2c1f66343935fb6bcfcd7dd2a6b8f34b74e9e7eb4c8e8e2faa9d77f0e",
);
try {
	// Too short
	TransactionHash.fromHex("0x1234");
} catch (error) {}

try {
	// Invalid characters
	TransactionHash.fromHex(
		"0xgggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg",
	);
} catch (error) {}

try {
	// Wrong byte length
	TransactionHash.fromBytes(Bytes.zero(31));
} catch (error) {}
