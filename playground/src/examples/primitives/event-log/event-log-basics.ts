import { Address, EventLog, Hash, Bytes, Bytes32 } from "@tevm/voltaire";
// ERC20 Transfer event: Transfer(address indexed from, address indexed to, uint256 value)
// Event signature hash: keccak256("Transfer(address,address,uint256)")
const transferSig = Hash(
	"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
);
const fromAddr = Hash(
	"0x000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e",
);
const toAddr = Hash(
	"0x000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045",
);

const transferLog = EventLog.create({
	address: Address("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"), // USDC
	topics: [transferSig, fromAddr, toAddr], // topic0 = signature, topic1-2 = indexed params
	data: Bytes([
		// 100 USDC (6 decimals) = 100000000 = 0x05F5E100
		0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
		0, 0, 0, 5, 245, 225, 0,
	]),
	blockNumber: 18000000n,
	transactionHash: Hash(
		"0x123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234",
	),
	logIndex: 5,
});

// Get event signature (topic0)
const signature = EventLog.getTopic0(transferLog);

// Get indexed parameters (topics[1+])
const indexed = EventLog.getIndexedTopics(transferLog);

// Match specific event signature
const matchesTransfer = EventLog.matchesTopics(transferLog, [transferSig]);

// Match with wildcard (null = any value)
const matchesFromAny = EventLog.matchesTopics(transferLog, [
	transferSig,
	fromAddr,
	null,
]);

// Match with OR logic (array of topics)
const alternativeAddr = Hash(
	"0x0000000000000000000000005aaed59320b9eb3cd462ddbaefa21da757f30fbd",
);
const matchesEither = EventLog.matchesTopics(transferLog, [
	transferSig,
	[fromAddr, alternativeAddr],
	null,
]);

const usdcAddr = Address("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48");
const daiAddr = Address("0x6b175474e89094c44da98b954eedeac495271d0f");

// Combine address, topics, and block range
const filter = {
	address: usdcAddr,
	topics: [transferSig, fromAddr, null], // Transfer from specific address
	fromBlock: 17000000n,
	toBlock: 19000000n,
};

const log1 = EventLog.create({
	address: usdcAddr,
	topics: [transferSig, fromAddr, toAddr],
	data: Bytes32.zero(),
	blockNumber: 18000000n,
});

const log2 = EventLog.create({
	address: daiAddr,
	topics: [transferSig, fromAddr, toAddr],
	data: Bytes32.zero(),
	blockNumber: 18000001n,
});

const log3 = EventLog.create({
	address: usdcAddr,
	topics: [transferSig, toAddr, fromAddr], // Different direction
	data: Bytes32.zero(),
	blockNumber: 18000002n,
});

const logs = [log1, log2, log3];

// Filter logs by address
const usdcLogs = EventLog.filterLogs(logs, { address: usdcAddr });

// Filter by specific topic pattern
const fromSpecificAddr = EventLog.filterLogs(logs, {
	topics: [transferSig, fromAddr, null],
});

// Sort logs by block number and log index
const sorted = EventLog.sortLogs([log3, log1, log2]);
