import { Address, Bytes, Bytes32, EventLog, Hash } from "@tevm/voltaire";
// Event signatures
const TRANSFER_SIG = Hash(
	"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
);
const APPROVAL_SIG = Hash(
	"0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925",
);
const MINT_SIG = Hash(
	"0x0f6798a560793a54c3bcfe86a93cde1e73087d944c0ea20544137d4121396885",
); // Mint(address indexed to, uint256 amount)
const BURN_SIG = Hash(
	"0xcc16f5dbb4873280815c1ee09dbd06736cffcc184412cf7a71a0fdb75d397ca5",
); // Burn(address indexed from, uint256 amount)

const tokenAddr = Address("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48");

const alice = Hash(
	"0x000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e",
);
const bob = Hash(
	"0x000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045",
);
const charlie = Hash(
	"0x0000000000000000000000005aaed59320b9eb3cd462ddbaefa21da757f30fbd",
);

// Create various event types
const events = [
	EventLog.create({
		address: tokenAddr,
		topics: [MINT_SIG, alice],
		data: Bytes32.zero().fill(0, 0, 31).fill(100, 31, 32), // 100 tokens
		blockNumber: 19400000n,
		logIndex: 0,
	}), // Mint to Alice
	EventLog.create({
		address: tokenAddr,
		topics: [TRANSFER_SIG, alice, bob],
		data: Bytes32.zero().fill(0, 0, 31).fill(50, 31, 32), // 50 tokens
		blockNumber: 19400000n,
		logIndex: 1,
	}), // Transfer Alice -> Bob
	EventLog.create({
		address: tokenAddr,
		topics: [APPROVAL_SIG, bob, charlie],
		data: Bytes32.zero().fill(0xff), // Unlimited
		blockNumber: 19400001n,
		logIndex: 0,
	}), // Bob approves Charlie
	EventLog.create({
		address: tokenAddr,
		topics: [TRANSFER_SIG, bob, charlie],
		data: Bytes32.zero().fill(0, 0, 31).fill(25, 31, 32), // 25 tokens
		blockNumber: 19400001n,
		logIndex: 1,
	}), // Transfer Bob -> Charlie
	EventLog.create({
		address: tokenAddr,
		topics: [BURN_SIG, charlie],
		data: Bytes32.zero().fill(0, 0, 31).fill(10, 31, 32), // 10 tokens
		blockNumber: 19400002n,
		logIndex: 0,
	}), // Charlie burns 10
];

function getEventType(log: (typeof events)[0]): string {
	const sig = EventLog.getTopic0(log);
	if (!sig) return "Unknown";

	const sigHex = sig.toHex();
	if (sigHex === TRANSFER_SIG.toHex()) return "Transfer";
	if (sigHex === APPROVAL_SIG.toHex()) return "Approval";
	if (sigHex === MINT_SIG.toHex()) return "Mint";
	if (sigHex === BURN_SIG.toHex()) return "Burn";
	return "Unknown";
}

events.forEach((event, i) => {
	const type = getEventType(event);
});

interface DecodedTransfer {
	type: "Transfer";
	from: Uint8Array;
	to: Uint8Array;
	amount: bigint;
}

interface DecodedApproval {
	type: "Approval";
	owner: Uint8Array;
	spender: Uint8Array;
	amount: bigint;
}

interface DecodedMint {
	type: "Mint";
	to: Uint8Array;
	amount: bigint;
}

interface DecodedBurn {
	type: "Burn";
	from: Uint8Array;
	amount: bigint;
}

type DecodedEvent =
	| DecodedTransfer
	| DecodedApproval
	| DecodedMint
	| DecodedBurn;

function decodeEvent(log: (typeof events)[0]): DecodedEvent | null {
	const sig = EventLog.getTopic0(log);
	if (!sig) return null;

	const sigHex = sig.toHex();
	const view = new DataView(log.data.buffer);
	const amount = view.getBigUint64(24, false);

	if (sigHex === TRANSFER_SIG.toHex()) {
		const [from, to] = EventLog.getIndexedTopics(log);
		// biome-ignore lint/style/noNonNullAssertion: topics guaranteed by event signature
		return { type: "Transfer", from: from!, to: to!, amount };
	}

	if (sigHex === APPROVAL_SIG.toHex()) {
		const [owner, spender] = EventLog.getIndexedTopics(log);
		// biome-ignore lint/style/noNonNullAssertion: topics guaranteed by event signature
		return { type: "Approval", owner: owner!, spender: spender!, amount };
	}

	if (sigHex === MINT_SIG.toHex()) {
		const [to] = EventLog.getIndexedTopics(log);
		// biome-ignore lint/style/noNonNullAssertion: topics guaranteed by event signature
		return { type: "Mint", to: to!, amount };
	}

	if (sigHex === BURN_SIG.toHex()) {
		const [from] = EventLog.getIndexedTopics(log);
		// biome-ignore lint/style/noNonNullAssertion: topics guaranteed by event signature
		return { type: "Burn", from: from!, amount };
	}

	return null;
}

events.forEach((event, i) => {
	const decoded = decodeEvent(event);
	if (!decoded) return;
	switch (decoded.type) {
		case "Transfer":
			break;
		case "Approval":
			break;
		case "Mint":
			break;
		case "Burn":
			break;
	}
});

const transfers = EventLog.filterLogs(events, {
	topics: [TRANSFER_SIG, null, null],
});

const approvals = EventLog.filterLogs(events, {
	topics: [APPROVAL_SIG, null, null],
});

const mints = EventLog.filterLogs(events, {
	topics: [MINT_SIG, null],
});

const burns = EventLog.filterLogs(events, {
	topics: [BURN_SIG, null],
});

interface BalanceChanges {
	[address: string]: bigint;
}

function calculateBalanceChanges(events: typeof events): BalanceChanges {
	const balances: BalanceChanges = {};

	for (const event of events) {
		const decoded = decodeEvent(event);
		if (!decoded) continue;

		switch (decoded.type) {
			case "Transfer": {
				const fromKey = decoded.from.toHex();
				const toKey = decoded.to.toHex();
				balances[fromKey] = (balances[fromKey] || 0n) - decoded.amount;
				balances[toKey] = (balances[toKey] || 0n) + decoded.amount;
				break;
			}
			case "Mint": {
				const toKey = decoded.to.toHex();
				balances[toKey] = (balances[toKey] || 0n) + decoded.amount;
				break;
			}
			case "Burn": {
				const fromKey = decoded.from.toHex();
				balances[fromKey] = (balances[fromKey] || 0n) - decoded.amount;
				break;
			}
		}
	}

	return balances;
}

const balances = calculateBalanceChanges(events);
Object.entries(balances).forEach(([addr, balance]) => {
	const sign = balance >= 0n ? "+" : "";
});

const sorted = EventLog.sortLogs(events);
sorted.forEach((event, i) => {
	const type = getEventType(event);
});

// Get all events affecting Alice (transfer, mint, or burn)
const aliceEvents = EventLog.filterLogs(events, {
	topics: [
		[TRANSFER_SIG, MINT_SIG, BURN_SIG], // Any of these signatures
		[alice, null], // Alice as first indexed param (works for all three)
		null,
	],
});

// Get transfers TO Alice (needs separate filter)
const transfersToAlice = EventLog.filterLogs(events, {
	topics: [TRANSFER_SIG, null, alice],
});
