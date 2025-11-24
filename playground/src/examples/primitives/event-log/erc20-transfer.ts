import { Address } from "../../../primitives/Address/index.js";
import { EventLog } from "../../../primitives/EventLog/index.js";
import { Hash } from "../../../primitives/Hash/index.js";

// Event signature: keccak256("Transfer(address,address,uint256)")
const TRANSFER_SIGNATURE = Hash(
	"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
);

// Real USDC transfer on Ethereum mainnet
const usdcAddress = Address("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48");

// Topics: [signature, from, to]
const fromAddress = Hash(
	"0x00000000000000000000000028c6c06298d514db089934071355e5743bf21d60", // Binance 14
);
const toAddress = Hash(
	"0x000000000000000000000000dfd5293d8e347dfe59e90efd55b2956a1343963d", // Binance 16
);

// Value: 1,000,000 USDC (6 decimals) = 1000000000000 wei = 0xE8D4A51000
const valueData = new Uint8Array(32);
valueData[26] = 0xe8;
valueData[27] = 0xd4;
valueData[28] = 0xa5;
valueData[29] = 0x10;
valueData[30] = 0x00;

const transferLog = EventLog.create({
	address: usdcAddress,
	topics: [TRANSFER_SIGNATURE, fromAddress, toAddress],
	data: valueData,
	blockNumber: 18500000n,
	transactionHash: Hash(
		"0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
	),
	transactionIndex: 42,
	logIndex: 15,
	blockHash: Hash(
		"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
	),
});

const signature = EventLog.getTopic0(transferLog);

const [from, to] = EventLog.getIndexedTopics(transferLog);

// Decode value from data field
const dataView = new DataView(transferLog.data.buffer);
const value = dataView.getBigUint64(24, false); // Read last 8 bytes

// Find all transfers from Binance 14
const fromBinance14 = EventLog.matchesTopics(transferLog, [
	TRANSFER_SIGNATURE,
	fromAddress,
	null,
]);

// Find all transfers to Binance 16
const toBinance16 = EventLog.matchesTopics(transferLog, [
	TRANSFER_SIGNATURE,
	null,
	toAddress,
]);

// Find transfers between specific addresses
const betweenBinance = EventLog.matchesTopics(transferLog, [
	TRANSFER_SIGNATURE,
	fromAddress,
	toAddress,
]);

const burnAddress = Hash(
	"0x0000000000000000000000000000000000000000000000000000000000000000",
);
const randomUser = Hash(
	"0x000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e",
);

const transfers = [
	transferLog, // Binance 14 -> Binance 16
	EventLog.create({
		address: usdcAddress,
		topics: [TRANSFER_SIGNATURE, fromAddress, randomUser],
		data: new Uint8Array(32),
		blockNumber: 18500001n,
	}), // Binance 14 -> User
	EventLog.create({
		address: usdcAddress,
		topics: [TRANSFER_SIGNATURE, randomUser, burnAddress],
		data: new Uint8Array(32),
		blockNumber: 18500002n,
	}), // User -> Burn
];

// Find all transfers from Binance 14
const allFromBinance = EventLog.filterLogs(transfers, {
	address: usdcAddress,
	topics: [TRANSFER_SIGNATURE, fromAddress, null],
});

// Find all burns (transfers to zero address)
const burns = EventLog.filterLogs(transfers, {
	topics: [TRANSFER_SIGNATURE, null, burnAddress],
});

// Sort transfers chronologically
const sorted = EventLog.sortLogs(transfers);
sorted.forEach((log, i) => {
	const [f, t] = EventLog.getIndexedTopics(log);
});
