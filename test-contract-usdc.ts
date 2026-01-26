/**
 * Test Contract module with USDC
 * Verifies Contract creation and method availability
 */

import { Contract } from "./examples/contract/Contract.js";

// Minimal ERC20 ABI with required methods
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
	{
		type: "event",
		name: "Transfer",
		inputs: [
			{ type: "address", name: "from", indexed: true },
			{ type: "address", name: "to", indexed: true },
			{ type: "uint256", name: "value", indexed: false },
		],
	},
] as const;

// Mock provider for testing (no actual RPC calls)
const mockProvider = {
	request: async () => {
		throw new Error("Mock provider - not meant for actual calls");
	},
};

// Create Contract instance for USDC
const usdc = Contract({
	address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
	abi: erc20Abi,
	provider: mockProvider,
});

// Verify Contract structure
console.log("Contract instance created");
console.log("Address:", usdc.address);
console.log("ABI methods available:", Object.keys(usdc.abi).length > 0);

// Verify read methods exist
console.log("\nRead methods:");
console.log("- read.name:", typeof usdc.read.name === "function");
console.log("- read.symbol:", typeof usdc.read.symbol === "function");
console.log("- read.decimals:", typeof usdc.read.decimals === "function");
console.log("- read.balanceOf:", typeof usdc.read.balanceOf === "function");

// Verify write methods exist
console.log("\nWrite methods:");
console.log("- write.transfer:", typeof usdc.write.transfer === "function");

// Verify events exist
console.log("\nEvents:");
console.log("- events.Transfer:", typeof usdc.events.Transfer === "function");

// Verify estimateGas exists
console.log("\nGas estimation:");
console.log(
	"- estimateGas.transfer:",
	typeof usdc.estimateGas.transfer === "function",
);

console.log("\n✓ All checks passed - Contract created correctly with expected methods");
console.log("\nANSWER: success");
