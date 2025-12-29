/**
 * Contract Events Example
 *
 * Demonstrates streaming contract events with async generators.
 */

import { Contract } from "../../src/contract/index.js";
import type { TypedProvider } from "../../src/provider/TypedProvider.js";

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

/**
 * Example: Stream All Transfer Events
 */
export async function streamAllTransfers(provider: TypedProvider) {
	const usdc = Contract({
		address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
		abi: erc20Abi,
		provider,
	});

	// Stream all Transfer events (live only)
	for await (const log of usdc.events.Transfer()) {
		console.log(`Transfer: ${log.args.from} -> ${log.args.to}`);
		console.log(`  Value: ${log.args.value}`);
		console.log(`  Block: ${log.blockNumber}`);
		console.log(`  Tx: ${log.transactionHash}`);
	}
}

/**
 * Example: Filter Events by Indexed Parameter
 */
export async function filterByAddress(provider: TypedProvider) {
	const usdc = Contract({
		address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
		abi: erc20Abi,
		provider,
	});

	const myAddress = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";

	// Transfers FROM my address
	console.log("Outgoing transfers:");
	for await (const log of usdc.events.Transfer({ from: myAddress })) {
		console.log(`Sent ${log.args.value} to ${log.args.to}`);
	}

	// Transfers TO my address
	console.log("Incoming transfers:");
	for await (const log of usdc.events.Transfer({ to: myAddress })) {
		console.log(`Received ${log.args.value} from ${log.args.from}`);
	}
}

/**
 * Example: Historical Events
 */
export async function getHistoricalEvents(provider: TypedProvider) {
	const usdc = Contract({
		address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
		abi: erc20Abi,
		provider,
	});

	// Get events from specific block range
	for await (const log of usdc.events.Transfer(
		{},
		{
			fromBlock: 18000000n,
			toBlock: 18001000n,
		},
	)) {
		console.log(log);
	}
	// Loop completes after processing historical events
	console.log("Done processing historical events");
}

/**
 * Example: Historical + Live Events
 */
export async function historicalThenLive(provider: TypedProvider) {
	const usdc = Contract({
		address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
		abi: erc20Abi,
		provider,
	});

	// Start from historical, continue with live
	for await (const log of usdc.events.Transfer({}, { fromBlock: 18000000n })) {
		// First: yields historical events (fast, batched)
		// Then: continues with live events
		console.log(`Block ${log.blockNumber}: ${log.args.value}`);
	}
}

/**
 * Example: Break on Condition
 */
export async function breakOnCondition(provider: TypedProvider) {
	const usdc = Contract({
		address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
		abi: erc20Abi,
		provider,
	});

	// Stop after finding a large transfer
	const threshold = 1000000n * 10n ** 6n; // 1M USDC

	for await (const log of usdc.events.Transfer()) {
		console.log(`Transfer: ${log.args.value}`);

		if (log.args.value > threshold) {
			console.log("Found whale transfer!");
			break; // Cleanup happens automatically
		}
	}

	console.log("Stopped watching events");
}

/**
 * Example: Collect First N Events
 */
export async function collectEvents(provider: TypedProvider) {
	const usdc = Contract({
		address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
		abi: erc20Abi,
		provider,
	});

	const events: Array<{
		from: string;
		to: string;
		value: bigint;
	}> = [];

	for await (const log of usdc.events.Transfer({}, { fromBlock: 18000000n })) {
		events.push({
			from: String(log.args.from),
			to: String(log.args.to),
			value: log.args.value as bigint,
		});

		if (events.length >= 100) {
			break;
		}
	}

	console.log(`Collected ${events.length} events`);
	return events;
}
