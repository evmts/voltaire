import { Address, EventLog, Hash, Bytes, Bytes32 } from "@tevm/voltaire";
const erc721Transfer = Hash(
	"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
);
const from1 = Hash(
	"0x000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e",
);
const to1 = Hash(
	"0x000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045",
);
const tokenId = Hash(
	"0x0000000000000000000000000000000000000000000000000000000000000001",
);

const log1 = EventLog.create({
	address: Address("0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d"),
	topics: [erc721Transfer, from1, to1, tokenId], // 4 topics total
	data: Bytes.zero(0), // Empty data - all params indexed
	blockNumber: 19000000n,
});
const erc20Transfer = erc721Transfer; // Same signature
const from2 = Hash(
	"0x000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e",
);
const to2 = Hash(
	"0x000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045",
);
const valueData = Bytes32.zero();
valueData[31] = 100; // 100 tokens

const log2 = EventLog.create({
	address: Address("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"),
	topics: [erc20Transfer, from2, to2], // 3 topics (value not indexed)
	data: valueData, // Value in data field
	blockNumber: 19000001n,
});
const dataStoredSig = Hash(
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
);

// Both key and value in data field (ABI encoded)
const customData = Bytes.zero(128);
// Simplified: would normally be ABI encoded string + bytes

const log3 = EventLog.create({
	address: Address("0x0000000000000000000000000000000000000123"),
	topics: [dataStoredSig], // Only signature
	data: customData,
	blockNumber: 19000002n,
});

const user = Hash(
	"0x000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e",
);
const otherUser = Hash(
	"0x000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045",
);

const logs = [
	EventLog.create({
		address: Address("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"),
		topics: [erc20Transfer, user, otherUser],
		data: Bytes32.zero(),
		blockNumber: 19000000n,
	}),
	EventLog.create({
		address: Address("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"),
		topics: [erc20Transfer, otherUser, user],
		data: Bytes32.zero(),
		blockNumber: 19000001n,
	}),
	EventLog.create({
		address: Address("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"),
		topics: [erc20Transfer, user, user],
		data: Bytes32.zero(),
		blockNumber: 19000002n,
	}),
];

// EFFICIENT: Filter by indexed parameter (from address)
const fromUserLogs = EventLog.filterLogs(logs, {
	topics: [erc20Transfer, user, null],
});

// EFFICIENT: Filter by indexed parameter (to address)
const toUserLogs = EventLog.filterLogs(logs, {
	topics: [erc20Transfer, null, user],
});

// INEFFICIENT: Would need to decode data for each log to filter by value
const highValueLogs = logs.filter((log) => {
	const view = new DataView(log.data.buffer);
	const value = view.getBigUint64(24, false);
	return value > 1000n;
});

// event NameRegistered(string indexed name, address owner)
// The string "alice.eth" is hashed when indexed
const nameRegisteredSig = Hash(
	"0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd",
);
const nameHash = Hash(
	"0x9c22ff5f21f0b81b113e63f7db6da94fedef11b2119b4088b89664fb9a3cb658", // keccak256("alice.eth")
);
const owner = Hash(
	"0x000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e",
);

const nameLog = EventLog.create({
	address: Address("0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85"), // ENS
	topics: [nameRegisteredSig, nameHash], // Name is hashed!
	data: Bytes32.zero(), // Owner could be here or indexed
	blockNumber: 19000003n,
});
