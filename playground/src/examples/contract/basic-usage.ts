/**
 * Contract Basic Usage
 *
 * Demonstrates creating a Contract instance and reading from it.
 * The Contract is a copyable pattern - you add it to your codebase.
 */

import { Abi } from "@tevm/voltaire/Abi";
import { Address } from "@tevm/voltaire/Address";
import { EventStream } from "@tevm/voltaire/EventStream";
import * as Hex from "@tevm/voltaire/Hex";

// ============================================================================
// Contract Implementation (copy this into your codebase)
// ============================================================================

class ContractFunctionNotFoundError extends Error {
	name = "ContractFunctionNotFoundError";
	constructor(functionName: string) {
		super(`Function "${functionName}" not found in contract ABI`);
	}
}

class ContractEventNotFoundError extends Error {
	name = "ContractEventNotFoundError";
	constructor(eventName: string) {
		super(`Event "${eventName}" not found in contract ABI`);
	}
}

function Contract<TAbi extends readonly unknown[]>(options: {
	address: string;
	abi: TAbi;
	provider: {
		request: (args: { method: string; params?: unknown[] }) => Promise<string>;
		on: () => unknown;
		removeListener: () => unknown;
	};
}) {
	const { abi: abiItems, provider } = options;
	const address = Address.from(options.address);
	const abi = Abi(abiItems);
	const addressHex = Hex.fromBytes(address);

	const read = new Proxy(
		{},
		{
			get(_target, prop) {
				if (typeof prop !== "string") return undefined;
				const functionName = prop;

				return async (...args: unknown[]) => {
					const fn = abi.getFunction(functionName);
					if (
						!fn ||
						(fn.stateMutability !== "view" && fn.stateMutability !== "pure")
					) {
						throw new ContractFunctionNotFoundError(functionName);
					}

					const data = abi.encode(functionName, args);
					const result = await provider.request({
						method: "eth_call",
						params: [{ to: addressHex, data: Hex.fromBytes(data) }, "latest"],
					});
					const decoded = abi.decode(functionName, Hex.toBytes(result));
					return decoded.length === 1 ? decoded[0] : decoded;
				};
			},
		},
	);

	const events = new Proxy(
		{},
		{
			get(_target, prop) {
				if (typeof prop !== "string") return undefined;
				const eventName = prop;

				return (filter?: unknown) => {
					const event = abi.getEvent(eventName);
					if (!event) throw new ContractEventNotFoundError(eventName);
					return EventStream({ provider, address, event, filter });
				};
			},
		},
	);

	return { address, abi, read, events };
}

// ============================================================================
// Example Usage
// ============================================================================

// ERC20 ABI (minimal for demo)
const erc20Abi = [
	{
		type: "function",
		name: "name",
		stateMutability: "view",
		inputs: [],
		outputs: [{ type: "string", name: "" }],
	},
	{
		type: "function",
		name: "symbol",
		stateMutability: "view",
		inputs: [],
		outputs: [{ type: "string", name: "" }],
	},
	{
		type: "function",
		name: "decimals",
		stateMutability: "view",
		inputs: [],
		outputs: [{ type: "uint8", name: "" }],
	},
	{
		type: "function",
		name: "balanceOf",
		stateMutability: "view",
		inputs: [{ type: "address", name: "account" }],
		outputs: [{ type: "uint256", name: "" }],
	},
] as const;

// Mock provider for demo
const mockProvider = {
	request: async ({
		method,
		params,
	}: { method: string; params?: unknown[] }) => {
		return `0x${"00".repeat(32)}`; // Mock response
	},
	on: () => mockProvider,
	removeListener: () => mockProvider,
};

// Create contract instance
const usdc = Contract({
	address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
	abi: erc20Abi,
	provider: mockProvider,
});

// Access the ABI for manual encoding
const calldata = usdc.abi.encode("balanceOf", [
	"0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
]);
