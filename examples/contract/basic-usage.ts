/**
 * Contract Basic Usage Example
 *
 * Demonstrates creating a Contract instance and using read/write methods.
 */

import { Contract } from "../../src/contract/index.js";
import type { TypedProvider } from "../../src/provider/TypedProvider.js";

// ERC20 ABI (minimal)
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
		name: "totalSupply",
		stateMutability: "view",
		inputs: [],
		outputs: [{ type: "uint256", name: "" }],
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
		type: "function",
		name: "approve",
		stateMutability: "nonpayable",
		inputs: [
			{ type: "address", name: "spender" },
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

/**
 * Example: Basic Contract Usage
 */
export async function basicContractUsage(provider: TypedProvider) {
	// Create contract instance
	const usdc = Contract({
		address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
		abi: erc20Abi,
		provider,
	});

	// Access contract address
	console.log("Contract address:", usdc.address);

	// Read token info
	const name = await usdc.read.name();
	const symbol = await usdc.read.symbol();
	const decimals = await usdc.read.decimals();

	console.log(`Token: ${name} (${symbol})`);
	console.log(`Decimals: ${decimals}`);

	// Read balance
	const holderAddress = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
	const balance = await usdc.read.balanceOf(holderAddress);

	console.log(`Balance: ${balance}`);
}

/**
 * Example: Parallel Reads
 */
export async function parallelReads(provider: TypedProvider) {
	const usdc = Contract({
		address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
		abi: erc20Abi,
		provider,
	});

	// Fetch multiple values in parallel
	const [name, symbol, decimals, totalSupply] = await Promise.all([
		usdc.read.name(),
		usdc.read.symbol(),
		usdc.read.decimals(),
		usdc.read.totalSupply(),
	]);

	console.log(`${name} (${symbol})`);
	console.log(`Decimals: ${decimals}`);
	console.log(`Total Supply: ${totalSupply}`);
}

/**
 * Example: Manual ABI Encoding
 */
export async function manualEncoding(provider: TypedProvider) {
	const usdc = Contract({
		address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
		abi: erc20Abi,
		provider,
	});

	// Encode calldata manually using the abi instance
	const calldata = usdc.abi.encode("balanceOf", [
		"0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
	]);

	console.log("Encoded calldata:", calldata);

	// Build transaction object manually
	const tx = {
		to: usdc.address,
		data: calldata,
	};

	console.log("Transaction:", tx);
}
