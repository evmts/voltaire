/**
 * EventStream Usage
 *
 * Demonstrates event streaming with backfill, watch, and dynamic chunking.
 */

import { Contract, EventStream } from "@voltaire/contract";

// ERC20 ABI with Transfer event
const erc20Abi = [
	{
		type: "event",
		name: "Transfer",
		inputs: [
			{ type: "address", name: "from", indexed: true },
			{ type: "address", name: "to", indexed: true },
			{ type: "uint256", name: "value", indexed: false },
		],
	},
	{
		type: "event",
		name: "Approval",
		inputs: [
			{ type: "address", name: "owner", indexed: true },
			{ type: "address", name: "spender", indexed: true },
			{ type: "uint256", name: "value", indexed: false },
		],
	},
] as const;

// Mock provider that simulates event logs
const mockProvider = {
	request: async ({ method, params }: { method: string; params?: any[] }) => {
		if (method === "eth_getLogs") {
			console.log("Fetching logs:", params);
			return [
				{
					address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
					topics: [
						"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
						"0x000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e",
						"0x0000000000000000000000008ba1f109551bd432803012645ac136ddd64dba72",
					],
					data: "0x0000000000000000000000000000000000000000000000000000000005f5e100",
					blockNumber: "0x1234",
					blockHash: "0x" + "ab".repeat(32),
					transactionHash: "0x" + "cd".repeat(32),
					logIndex: "0x0",
				},
			];
		}
		if (method === "eth_blockNumber") {
			return "0x1234";
		}
		return "0x";
	},
	on: () => mockProvider,
	removeListener: () => mockProvider,
};

// ============================================================================
// Via Contract
// ============================================================================

console.log("=== EventStream via Contract ===\n");

const usdc = Contract({
	address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
	abi: erc20Abi,
	provider: mockProvider as any,
});

// Get EventStream for Transfer events
const stream = usdc.events.Transfer({});

console.log("EventStream created with backfill and watch methods:");
console.log("- stream.backfill({ fromBlock, toBlock })");
console.log("- stream.watch({ signal, pollingInterval })");

// Backfill historical events
console.log("\n--- Backfilling historical events ---");
for await (const { log, metadata } of stream.backfill({
	fromBlock: 4000n,
	toBlock: 5000n,
})) {
	console.log(`Event: ${log.eventName}`);
	console.log(`  From: ${log.args.from}`);
	console.log(`  To: ${log.args.to}`);
	console.log(`  Value: ${log.args.value}`);
	console.log(`  Block: ${metadata.fromBlock} - ${metadata.toBlock}`);
}

// ============================================================================
// Standalone EventStream
// ============================================================================

console.log("\n=== Standalone EventStream ===\n");

const transferEvent = {
	type: "event" as const,
	name: "Transfer" as const,
	inputs: [
		{ type: "address" as const, name: "from" as const, indexed: true },
		{ type: "address" as const, name: "to" as const, indexed: true },
		{ type: "uint256" as const, name: "value" as const, indexed: false },
	],
};

const standaloneStream = EventStream({
	provider: mockProvider as any,
	address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
	event: transferEvent,
	filter: { from: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e" },
});

console.log("Standalone EventStream created with filter");

for await (const { log } of standaloneStream.backfill({
	fromBlock: 0n,
	toBlock: 100n,
})) {
	console.log(`Filtered transfer: ${log.args.value}`);
}

// ============================================================================
// Abort Signal Example
// ============================================================================

console.log("\n=== Abort Signal Usage ===\n");

const controller = new AbortController();

// Abort after collecting one event
setTimeout(() => {
	console.log("Aborting stream...");
	controller.abort();
}, 100);

try {
	for await (const { log } of stream.backfill({
		fromBlock: 0n,
		toBlock: 1000n,
		signal: controller.signal,
	})) {
		console.log(`Got event: ${log.eventName}`);
	}
} catch (error: any) {
	console.log(`Stream ended: ${error.name}`);
}

console.log("\n=== Done ===");
