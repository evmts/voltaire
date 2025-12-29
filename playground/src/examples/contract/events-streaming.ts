/**
 * EventStream Usage
 *
 * Demonstrates event streaming with backfill, watch, and dynamic chunking.
 * Contract is a copyable pattern. EventStream is a library primitive.
 */

import { Abi } from "@tevm/voltaire/Abi";
import { Address } from "@tevm/voltaire/Address";
import * as Hex from "@tevm/voltaire/Hex";
import { EventStream } from "@tevm/voltaire/EventStream";

// ============================================================================
// Contract Implementation (copy this into your codebase)
// ============================================================================

class ContractEventNotFoundError extends Error {
	name = "ContractEventNotFoundError";
	constructor(eventName: string) {
		super(`Event "${eventName}" not found in contract ABI`);
	}
}

function Contract<TAbi extends readonly any[]>(options: {
	address: string;
	abi: TAbi;
	provider: any;
}) {
	const { abi: abiItems, provider } = options;
	const address = Address.from(options.address);
	const abi = Abi(abiItems);

	const events = new Proxy(
		{},
		{
			get(_target, prop) {
				if (typeof prop !== "string") return undefined;
				const eventName = prop;

				return (filter?: any) => {
					const event = abi.getEvent(eventName);
					if (!event) throw new ContractEventNotFoundError(eventName);
					return EventStream({ provider, address, event, filter });
				};
			},
		},
	);

	return { address, abi, events };
}

// ============================================================================
// Example Usage
// ============================================================================

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
					blockHash: `0x${"ab".repeat(32)}`,
					transactionHash: `0x${"cd".repeat(32)}`,
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

// Via Contract pattern
const usdc = Contract({
	address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
	abi: erc20Abi,
	provider: mockProvider as any,
});

// Get EventStream for Transfer events
const stream = usdc.events.Transfer({});
for await (const { log, metadata } of stream.backfill({
	fromBlock: 4000n,
	toBlock: 5000n,
})) {
}

// Or use EventStream directly (library primitive)
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

for await (const { log } of standaloneStream.backfill({
	fromBlock: 0n,
	toBlock: 100n,
})) {
}

// Cancellation with AbortSignal
const controller = new AbortController();

setTimeout(() => {
	controller.abort();
}, 100);

try {
	for await (const { log } of stream.backfill({
		fromBlock: 0n,
		toBlock: 1000n,
		signal: controller.signal,
	})) {
	}
} catch (error: any) {}
