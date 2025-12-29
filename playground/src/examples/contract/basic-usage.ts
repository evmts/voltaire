/**
 * Contract Basic Usage
 *
 * Demonstrates creating a Contract instance and reading from it.
 */

import { Contract } from "@voltaire/contract";

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
	{
		type: "function",
		name: "transfer",
		stateMutability: "nonpayable",
		inputs: [
			{ type: "address", name: "to" },
			{ type: "uint256", name: "amount" },
		],
		outputs: [{ type: "bool", name: "" }],
	},
] as const;

// Mock provider for demo
const mockProvider = {
	request: async ({ method, params }: { method: string; params?: any[] }) => {
		console.log(`Provider: ${method}`, params);
		return "0x" + "00".repeat(32); // Mock response
	},
	on: () => mockProvider,
	removeListener: () => mockProvider,
};

// Create contract instance
const usdc = Contract({
	address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
	abi: erc20Abi,
	provider: mockProvider as any,
});

console.log("Contract created!");
console.log("Address:", usdc.address);

// Access the ABI for manual encoding
const calldata = usdc.abi.encode("balanceOf", [
	"0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
]);
console.log("Encoded balanceOf calldata:", calldata);

// The read/write/estimateGas methods require a real provider
// They will throw NotImplementedError until implemented
console.log("\nContract interfaces available:");
console.log("- usdc.read.balanceOf(address)");
console.log("- usdc.read.name()");
console.log("- usdc.write.transfer(to, amount)");
console.log("- usdc.estimateGas.transfer(to, amount)");
console.log("- usdc.events.Transfer({ from: address })");
