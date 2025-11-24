import { Address } from "../../../primitives/Address/index.js";
import { EventLog } from "../../../primitives/EventLog/index.js";
import { Hash } from "../../../primitives/Hash/index.js";

// Setup: Create sample ERC20 Transfer logs
const TRANSFER_SIG = Hash(
	"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
);

const alice = Hash(
	"0x000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e",
);
const bob = Hash(
	"0x000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045",
);
const charlie = Hash(
	"0x0000000000000000000000005aaed59320b9eb3cd462ddbaefa21da757f30fbd",
);
const dave = Hash(
	"0x000000000000000000000000a858ddc0445d8131dac4d1de01f834ffcba52ef1",
);

const usdcAddr = Address("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48");

const logs = [
	EventLog.create({
		address: usdcAddr,
		topics: [TRANSFER_SIG, alice, bob],
		data: new Uint8Array(32),
		blockNumber: 19100000n,
	}), // Alice -> Bob
	EventLog.create({
		address: usdcAddr,
		topics: [TRANSFER_SIG, bob, charlie],
		data: new Uint8Array(32),
		blockNumber: 19100001n,
	}), // Bob -> Charlie
	EventLog.create({
		address: usdcAddr,
		topics: [TRANSFER_SIG, charlie, alice],
		data: new Uint8Array(32),
		blockNumber: 19100002n,
	}), // Charlie -> Alice
	EventLog.create({
		address: usdcAddr,
		topics: [TRANSFER_SIG, alice, dave],
		data: new Uint8Array(32),
		blockNumber: 19100003n,
	}), // Alice -> Dave
	EventLog.create({
		address: usdcAddr,
		topics: [TRANSFER_SIG, dave, bob],
		data: new Uint8Array(32),
		blockNumber: 19100004n,
	}), // Dave -> Bob
];

const exactMatch = EventLog.filterLogs(logs, {
	topics: [TRANSFER_SIG, alice, bob],
});

const fromAlice = EventLog.filterLogs(logs, {
	topics: [TRANSFER_SIG, alice, null], // Any recipient
});

const toBob = EventLog.filterLogs(logs, {
	topics: [TRANSFER_SIG, null, bob], // Any sender
});

const anyTransfer = EventLog.filterLogs(logs, {
	topics: [TRANSFER_SIG, null, null], // Any sender, any recipient
});

const fromAliceOrBob = EventLog.filterLogs(logs, {
	topics: [TRANSFER_SIG, [alice, bob], null],
});

const toAliceOrCharlie = EventLog.filterLogs(logs, {
	topics: [TRANSFER_SIG, null, [alice, charlie]],
});

// Both positions with OR logic
const complexOr = EventLog.filterLogs(logs, {
	topics: [TRANSFER_SIG, [alice, bob], [bob, charlie]],
});

// Only care about event signature, ignore parameters
const anyTransferBySignature = EventLog.filterLogs(logs, {
	topics: [TRANSFER_SIG],
});

// Care about first parameter only
const fromAlicePartial = EventLog.filterLogs(logs, {
	topics: [TRANSFER_SIG, alice],
});

const daiAddr = Address("0x6b175474e89094c44da98b954eedeac495271d0f");

const moreLogs = [
	...logs,
	EventLog.create({
		address: daiAddr,
		topics: [TRANSFER_SIG, alice, bob],
		data: new Uint8Array(32),
		blockNumber: 19100005n,
	}), // Alice -> Bob on DAI
];

const usdcFromAlice = EventLog.filterLogs(moreLogs, {
	address: usdcAddr,
	topics: [TRANSFER_SIG, alice, null],
});

const anyTokenFromAlice = EventLog.filterLogs(moreLogs, {
	address: [usdcAddr, daiAddr],
	topics: [TRANSFER_SIG, alice, null],
});

const earlyTransfers = EventLog.filterLogs(logs, {
	topics: [TRANSFER_SIG, null, null],
	fromBlock: 19100000n,
	toBlock: 19100002n,
});

const afterBlock = EventLog.filterLogs(logs, {
	topics: [TRANSFER_SIG, null, null],
	fromBlock: 19100003n,
});

// All transfers involving Alice (sent OR received)
const aliceSent = EventLog.filterLogs(logs, {
	topics: [TRANSFER_SIG, alice, null],
});
const aliceReceived = EventLog.filterLogs(logs, {
	topics: [TRANSFER_SIG, null, alice],
});
const aliceActivity = [...aliceSent, ...aliceReceived];

// Transfers between specific pair (both directions)
const aliceBobBoth = EventLog.filterLogs(logs, {
	topics: [TRANSFER_SIG, [alice, bob], [alice, bob]],
});

// Get all transfers NOT from Alice (manual filtering)
const allTransfers = EventLog.filterLogs(logs, {
	topics: [TRANSFER_SIG, null, null],
});
const notFromAlice = allTransfers.filter((log) => {
	const [from] = EventLog.getIndexedTopics(log);
	return from?.toHex() !== alice.toHex();
});

const allLogs = EventLog.filterLogs(logs, {});

const allLogsNoTopics = EventLog.filterLogs(logs, {
	topics: [],
});
