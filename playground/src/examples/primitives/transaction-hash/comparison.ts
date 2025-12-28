import { TransactionHash } from "voltaire";
// Create test hashes
const hash1 = TransactionHash.from(
	"0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b",
);
const hash2 = TransactionHash.from(
	"0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b",
);
const hash3 = TransactionHash.from(
	"0xb3b20624f8f0f86eb50dd04688409e5cea4bd02d700bf6e79e9384d47d6a5a35",
);
const lowercase = TransactionHash.from(
	"0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b",
);
const uppercase = TransactionHash.from(
	"0x88DF016429689C079F3B2F6AD39FA052532C56795B733DA78A91EBE6A713944B",
);
const mixed = TransactionHash.from(
	"0x88dF016429689c079f3B2f6aD39fA052532C56795b733dA78a91eBe6a713944B",
);
const original = TransactionHash.from(
	"0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060",
);
const copy = TransactionHash.fromBytes(original);
const legacyTxHash = TransactionHash.from(
	"0x1111111111111111111111111111111111111111111111111111111111111111",
);
const eip1559TxHash = TransactionHash.from(
	"0x2222222222222222222222222222222222222222222222222222222222222222",
);
const eip4844TxHash = TransactionHash.from(
	"0x3333333333333333333333333333333333333333333333333333333333333333",
);
const txHashes = [
	TransactionHash.from(
		"0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b",
	),
	TransactionHash.from(
		"0xb3b20624f8f0f86eb50dd04688409e5cea4bd02d700bf6e79e9384d47d6a5a35",
	),
	TransactionHash.from(
		"0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b",
	), // Duplicate
	TransactionHash.from(
		"0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060",
	),
];
const uniqueHashes = txHashes.filter(
	(hash, index, self) =>
		index === self.findIndex((h) => TransactionHash.equals(h, hash)),
);
for (const hash of uniqueHashes) {
}
const targetHash = TransactionHash.from(
	"0xb3b20624f8f0f86eb50dd04688409e5cea4bd02d700bf6e79e9384d47d6a5a35",
);
const transactions = [
	{
		hash: TransactionHash.from(
			"0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b",
		),
		from: "0x1234...",
		value: 1n,
	},
	{
		hash: TransactionHash.from(
			"0xb3b20624f8f0f86eb50dd04688409e5cea4bd02d700bf6e79e9384d47d6a5a35",
		),
		from: "0x5678...",
		value: 2n,
	},
	{
		hash: TransactionHash.from(
			"0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060",
		),
		from: "0x9abc...",
		value: 3n,
	},
];

const found = transactions.find((tx) =>
	TransactionHash.equals(tx.hash, targetHash),
);
if (found) {
}
