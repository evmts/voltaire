/**
 * Event Signature Example
 *
 * Demonstrates:
 * - Computing event signatures (topic0)
 * - Filtering logs by event type
 * - Decoding indexed parameters
 * - Working with common ERC standards
 */

import { Hash } from "../../../src/primitives/Hash/index.js";

// Event signatures are keccak256(eventName(param1Type,param2Type,...))
// The hash becomes topic0 in event logs

// ERC-20 Events
const transferSig = Hash.keccak256String("Transfer(address,address,uint256)");
const approvalSig = Hash.keccak256String("Approval(address,address,uint256)");

// ERC-721 Events
const nftTransferSig = Hash.keccak256String(
	"Transfer(address,address,uint256)",
); // Same as ERC-20
const nftApprovalSig = Hash.keccak256String(
	"Approval(address,address,uint256)",
); // Same as ERC-20
const approvalForAllSig = Hash.keccak256String(
	"ApprovalForAll(address,address,bool)",
);

// ERC-1155 Events
const transferSingleSig = Hash.keccak256String(
	"TransferSingle(address,address,address,uint256,uint256)",
);
const transferBatchSig = Hash.keccak256String(
	"TransferBatch(address,address,address,uint256[],uint256[])",
);

// Custom Events
const depositSig = Hash.keccak256String("Deposit(address,uint256)");
const withdrawalSig = Hash.keccak256String("Withdrawal(address,uint256)");
const swapSig = Hash.keccak256String(
	"Swap(address,uint256,uint256,uint256,uint256,address)",
);

interface EventLog {
	address: string; // Contract address
	topics: string[]; // [topic0, indexed1, indexed2, indexed3]
	data: string; // Non-indexed parameters (ABI-encoded)
	blockNumber: number;
	transactionHash: string;
}

// Example Transfer event log
const transferLog: EventLog = {
	address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
	topics: [
		transferSig.toHex(), // topic0 = event signature
		"0x000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f51e3e", // from (indexed)
		"0x00000000000000000000000028c6c06298d514db089934071355e5743bf21d60", // to (indexed)
	],
	data: "0x0000000000000000000000000000000000000000000000000000000005f5e100", // value (not indexed)
	blockNumber: 18000000,
	transactionHash:
		"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
};

function isTransferEvent(log: EventLog): boolean {
	if (log.topics.length === 0) return false;
	const topic0 = Hash.fromHex(log.topics[0]);
	return topic0.equals(transferSig);
}

function isApprovalEvent(log: EventLog): boolean {
	if (log.topics.length === 0) return false;
	const topic0 = Hash.fromHex(log.topics[0]);
	return topic0.equals(approvalSig);
}

function isDepositEvent(log: EventLog): boolean {
	if (log.topics.length === 0) return false;
	const topic0 = Hash.fromHex(log.topics[0]);
	return topic0.equals(depositSig);
}

// Sample logs
const sampleLogs: EventLog[] = [
	{ ...transferLog, topics: [transferSig.toHex(), "0x...", "0x..."] },
	{ ...transferLog, topics: [approvalSig.toHex(), "0x...", "0x..."] },
	{ ...transferLog, topics: [depositSig.toHex(), "0x..."] },
	{ ...transferLog, topics: [transferSig.toHex(), "0x...", "0x..."] },
];

const transfers = sampleLogs.filter(isTransferEvent);
const approvals = sampleLogs.filter(isApprovalEvent);
const deposits = sampleLogs.filter(isDepositEvent);

type EventType = "Transfer" | "Approval" | "Deposit" | "Unknown";

function getEventType(log: EventLog): EventType {
	if (log.topics.length === 0) return "Unknown";

	const topic0 = Hash.fromHex(log.topics[0]);

	if (topic0.equals(transferSig)) return "Transfer";
	if (topic0.equals(approvalSig)) return "Approval";
	if (topic0.equals(depositSig)) return "Deposit";

	return "Unknown";
}
sampleLogs.forEach((log, i) => {
	const type = getEventType(log);
});

interface EventInfo {
	name: string;
	signature: string;
	topic0: Hash;
}

class EventRegistry {
	private events = new Map<string, EventInfo>();

	register(signature: string): void {
		const topic0 = Hash.keccak256String(signature);
		const name = signature.split("(")[0];

		this.events.set(topic0.toHex(), {
			name,
			signature,
			topic0,
		});
	}

	lookup(topic0: string): EventInfo | undefined {
		return this.events.get(topic0);
	}

	lookupByHash(hash: Hash): EventInfo | undefined {
		return this.events.get(hash.toHex());
	}
}

// Build registry
const registry = new EventRegistry();
registry.register("Transfer(address,address,uint256)");
registry.register("Approval(address,address,uint256)");
registry.register("Deposit(address,uint256)");
registry.register("Withdrawal(address,uint256)");
registry.register("Swap(address,uint256,uint256,uint256,uint256,address)");
sampleLogs.forEach((log, i) => {
	const event = registry.lookup(log.topics[0]);
	if (event) {
	} else {
	}
});

function verifyEventSignature(
	signature: string,
	expectedHash: string,
): boolean {
	const computed = Hash.keccak256String(signature);
	const expected = Hash.fromHex(expectedHash);
	return computed.equals(expected);
}

// Known Transfer event hash
const knownTransferHash =
	"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

const isValid = verifyEventSignature(
	"Transfer(address,address,uint256)",
	knownTransferHash,
);

const erc20Events = [
	"Transfer(address,address,uint256)",
	"Approval(address,address,uint256)",
];
erc20Events.forEach((sig) => {
	const hash = Hash.keccak256String(sig);
});

// Example: Get all Transfer events from a contract
interface GetLogsParams {
	fromBlock: number;
	toBlock: number;
	address: string; // Contract address
	topics: (string | null)[]; // Filter by topics
}

const transferQuery: GetLogsParams = {
	fromBlock: 18000000,
	toBlock: 18001000,
	address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
	topics: [
		transferSig.toHex(), // topic0 = Transfer event
		null, // from (any address)
		null, // to (any address)
	],
};

// Query for specific from address
const specificFromQuery: GetLogsParams = {
	...transferQuery,
	topics: [
		transferSig.toHex(),
		"0x000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f51e3e", // specific from
		null, // any to
	],
};
