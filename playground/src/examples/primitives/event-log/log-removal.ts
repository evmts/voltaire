import { Address, Bytes, Bytes32, EventLog, Hash } from "@tevm/voltaire";
const TRANSFER_SIG = Hash(
	"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
);
const usdcAddr = Address("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48");

const alice = Hash(
	"0x000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e",
);
const bob = Hash(
	"0x000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045",
);

const normalLog = EventLog.create({
	address: usdcAddr,
	topics: [TRANSFER_SIG, alice, bob],
	data: Bytes32.zero(),
	blockNumber: 19300000n,
	removed: false, // Explicitly set to false
});

const removedLog = EventLog.create({
	address: usdcAddr,
	topics: [TRANSFER_SIG, alice, bob],
	data: Bytes32.zero(),
	blockNumber: 19300001n,
	removed: true, // Marked as removed
});

// Initial state: Blocks 100-102 on chain A
const logsChainA = [
	EventLog.create({
		address: usdcAddr,
		topics: [TRANSFER_SIG, alice, bob],
		data: Bytes32.zero(),
		blockNumber: 19300100n,
		blockHash: Hash(
			"0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
		),
		removed: false,
	}),
	EventLog.create({
		address: usdcAddr,
		topics: [TRANSFER_SIG, bob, alice],
		data: Bytes32.zero(),
		blockNumber: 19300101n,
		blockHash: Hash(
			"0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
		),
		removed: false,
	}),
	EventLog.create({
		address: usdcAddr,
		topics: [TRANSFER_SIG, alice, bob],
		data: Bytes32.zero(),
		blockNumber: 19300102n,
		blockHash: Hash(
			"0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
		),
		removed: false,
	}),
];

// After reorg: Blocks 101-102 removed, replaced with blocks on chain B
const logsAfterReorg = [
	// biome-ignore lint/style/noNonNullAssertion: example code with known valid array indices
	logsChainA[0]!, // Block 100 stays
	EventLog.create({
		// biome-ignore lint/style/noNonNullAssertion: example code with known valid array indices
		...logsChainA[1]!,
		removed: true, // Block 101 removed
	}),
	EventLog.create({
		// biome-ignore lint/style/noNonNullAssertion: example code with known valid array indices
		...logsChainA[2]!,
		removed: true, // Block 102 removed
	}),
	// New blocks on chain B
	EventLog.create({
		address: usdcAddr,
		topics: [TRANSFER_SIG, bob, alice],
		data: Bytes32.zero(),
		blockNumber: 19300101n,
		blockHash: Hash(
			"0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
		),
		removed: false,
	}), // Different block hash
	EventLog.create({
		address: usdcAddr,
		topics: [TRANSFER_SIG, alice, bob],
		data: Bytes32.zero(),
		blockNumber: 19300102n,
		blockHash: Hash(
			"0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
		),
		removed: false,
	}),
];
logsAfterReorg.forEach((log) => {
	const [from, to] = EventLog.getIndexedTopics(log);
	const status = EventLog.isRemoved(log) ? "[REMOVED]" : "[ACTIVE]";
});

const activeLogs = logsAfterReorg.filter((log) => !EventLog.isRemoved(log));
const removedLogs = logsAfterReorg.filter((log) => EventLog.isRemoved(log));

const oldBlock = EventLog.create({
	address: usdcAddr,
	topics: [TRANSFER_SIG, alice, bob],
	data: Bytes32.zero(),
	blockNumber: 19300200n,
	blockHash: Hash(
		"0x1111111111111111111111111111111111111111111111111111111111111111",
	),
});

const newBlock = EventLog.create({
	address: usdcAddr,
	topics: [TRANSFER_SIG, alice, bob],
	data: Bytes32.zero(),
	blockNumber: 19300200n,
	blockHash: Hash(
		"0x2222222222222222222222222222222222222222222222222222222222222222",
	),
});

const sameBlockNumber = oldBlock.blockNumber === newBlock.blockNumber;
const differentHash =
	oldBlock.blockHash && newBlock.blockHash
		? oldBlock.blockHash.toHex() !== newBlock.blockHash.toHex()
		: false;

if (sameBlockNumber && differentHash) {
}
