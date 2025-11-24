import * as Hash from "../../../primitives/Hash/index.js";
import * as TransactionHash from "../../../primitives/TransactionHash/index.js";

// Simulated transaction database
interface TransactionRecord {
	hash: Uint8Array;
	blockNumber: bigint;
	from: string;
	to: string | null;
	value: bigint;
	gasUsed: bigint;
	status: "success" | "failed" | "pending";
}

const transactionDatabase: TransactionRecord[] = [
	{
		hash: TransactionHash.from(
			"0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b",
		),
		blockNumber: 12965000n,
		from: "0x742d35cc6634c0532925a3b844bc9e7595f0beb0",
		to: "0x1234567890123456789012345678901234567890",
		value: 1000000000000000000n, // 1 ETH
		gasUsed: 21000n,
		status: "success",
	},
	{
		hash: TransactionHash.from(
			"0xb3b20624f8f0f86eb50dd04688409e5cea4bd02d700bf6e79e9384d47d6a5a35",
		),
		blockNumber: 12965001n,
		from: "0x5aae5d938209eb3cd462ddbbaefa21da757f30fb",
		to: "0x6b175474e89094c44da98b954eedeac495271d0f",
		value: 0n,
		gasUsed: 65000n,
		status: "success",
	},
	{
		hash: TransactionHash.from(
			"0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060",
		),
		blockNumber: 46147n,
		from: "0x5df9b87991262f6ba471f09758cde1c0fc1de734",
		to: "0x31b98d14007bdee637298086988a0bbd31184523",
		value: 5000000000000000000n, // 5 ETH
		gasUsed: 21000n,
		status: "success",
	},
];

// Lookup function
function lookupTransaction(hash: Uint8Array): TransactionRecord | undefined {
	return transactionDatabase.find((tx) =>
		TransactionHash.equals(tx.hash, hash),
	);
}
const lookup1 = TransactionHash.from(
	"0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b",
);
const result1 = lookupTransaction(lookup1);
if (result1) {
}
const lookup2 = TransactionHash.from(
	"0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060",
);
const result2 = lookupTransaction(lookup2);
if (result2) {
}
const lookup3 = TransactionHash.from(
	"0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
);
const result3 = lookupTransaction(lookup3);
if (result3) {
} else {
}
const hashesToLookup = [
	TransactionHash.from(
		"0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b",
	),
	TransactionHash.from(
		"0xb3b20624f8f0f86eb50dd04688409e5cea4bd02d700bf6e79e9384d47d6a5a35",
	),
	TransactionHash.from(
		"0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
	),
];

const results = hashesToLookup.map((hash) => ({
	hash: Hash.toHex(hash),
	found: lookupTransaction(hash) !== undefined,
}));
for (const result of results) {
}
const successfulTxs = transactionDatabase.filter(
	(tx) => tx.status === "success",
);
for (const tx of successfulTxs) {
	const hashStr = Hash.toHex(tx.hash);
}
const threshold = 2_000_000_000_000_000_000n; // 2 ETH
const highValueTxs = transactionDatabase.filter((tx) => tx.value >= threshold);
for (const tx of highValueTxs) {
	const hashStr = Hash.toHex(tx.hash);
}
