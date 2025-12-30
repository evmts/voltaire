/**
 * Contract Gas Estimation Example
 *
 * Demonstrates estimating gas for contract transactions.
 */

import type { TypedProvider } from "../../src/provider/TypedProvider.js";
import { Contract } from "./Contract.js";

const erc20Abi = [
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
] as const;

/**
 * Example: Basic Gas Estimation
 */
export async function basicGasEstimation(provider: TypedProvider) {
	const usdc = Contract({
		address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
		abi: erc20Abi,
		provider,
	});

	const to = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
	const amount = 1000n * 10n ** 6n; // 1000 USDC

	// Estimate gas for transfer
	const gas = await usdc.estimateGas.transfer(to, amount);
}

/**
 * Example: Estimate with Buffer
 */
export async function estimateWithBuffer(provider: TypedProvider) {
	const usdc = Contract({
		address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
		abi: erc20Abi,
		provider,
	});

	const to = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
	const amount = 1000n * 10n ** 6n;

	const estimated = await usdc.estimateGas.transfer(to, amount);

	// Add safety buffers
	const buffer10 = (estimated * 110n) / 100n; // 10% buffer
	const buffer20 = (estimated * 120n) / 100n; // 20% buffer (recommended)
	const buffer50 = (estimated * 150n) / 100n; // 50% buffer (conservative)
}

/**
 * Example: Safe Transfer with Estimation
 */
export async function safeTransfer(provider: TypedProvider) {
	const usdc = Contract({
		address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
		abi: erc20Abi,
		provider,
	});

	const to = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
	const amount = 1000n * 10n ** 6n;

	try {
		// First estimate - this throws if tx would revert
		const gas = await usdc.estimateGas.transfer(to, amount);
	} catch (error) {
		console.error("Transaction would fail:", error);
		// Don't send - would waste gas
	}
}

/**
 * Example: Compare Gas Costs
 */
export async function compareGasCosts(provider: TypedProvider) {
	const usdc = Contract({
		address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
		abi: erc20Abi,
		provider,
	});

	const addresses = [
		"0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
		"0x1234567890123456789012345678901234567890",
		"0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
	];

	const amount = 1000n * 10n ** 6n;

	// Estimate gas for multiple recipients
	const estimates = await Promise.all(
		addresses.map((addr) => usdc.estimateGas.transfer(addr, amount)),
	);
	for (const [i, gas] of estimates.entries()) {
	}

	const total = estimates.reduce((sum, gas) => sum + gas, 0n);
}

/**
 * Example: Calculate Transaction Cost
 */
export async function calculateCost(provider: TypedProvider) {
	const usdc = Contract({
		address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
		abi: erc20Abi,
		provider,
	});

	const to = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
	const amount = 1000n * 10n ** 6n;

	// Get gas estimate
	const gasLimit = await usdc.estimateGas.transfer(to, amount);

	// Get current gas price
	const gasPrice = await provider.request({
		method: "eth_gasPrice",
	});

	// Calculate cost
	const costWei = gasLimit * BigInt(gasPrice);
	const costGwei = costWei / 10n ** 9n;
	const costEth = Number(costWei) / 1e18;
}

/**
 * Example: Estimate Multiple Operations
 */
export async function estimateMultipleOps(provider: TypedProvider) {
	const usdc = Contract({
		address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
		abi: erc20Abi,
		provider,
	});

	const spender = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // Uniswap Router
	const recipient = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
	const amount = 1000n * 10n ** 6n;

	// Estimate all operations in parallel
	const [approveGas, transferGas] = await Promise.all([
		usdc.estimateGas.approve(spender, amount),
		usdc.estimateGas.transfer(recipient, amount),
	]);
}
