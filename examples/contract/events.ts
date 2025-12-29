/**
 * Contract Events Example
 *
 * Demonstrates streaming contract events with async generators.
 */

import { Contract } from "./Contract.js";
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
	for await (const log of usdc.events.Transfer({ from: myAddress })) {
	}
	for await (const log of usdc.events.Transfer({ to: myAddress })) {
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
	}
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
		if (log.args.value > threshold) {
			break; // Cleanup happens automatically
		}
	}
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
	return events;
}
