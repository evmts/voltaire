// Note: getAbiItem is not implemented in @tevm/primitives
// This is a developer productivity tool for extracting specific items from an ABI
// Guil focuses on the core encoding/decoding primitives rather than ABI manipulation utilities
// For comparison purposes, we use viem's getAbiItem as a fallback

import { getAbiItem } from "viem";

// Full ERC-20 ABI
const abi = [
	{
		type: "function",
		name: "balanceOf",
		stateMutability: "view",
		inputs: [{ name: "owner", type: "address" }],
		outputs: [{ type: "uint256" }],
	},
	{
		type: "function",
		name: "transfer",
		stateMutability: "nonpayable",
		inputs: [
			{ name: "to", type: "address" },
			{ name: "amount", type: "uint256" },
		],
		outputs: [{ type: "bool" }],
	},
	{
		type: "function",
		name: "approve",
		stateMutability: "nonpayable",
		inputs: [
			{ name: "spender", type: "address" },
			{ name: "amount", type: "uint256" },
		],
		outputs: [{ type: "bool" }],
	},
	{
		type: "event",
		name: "Transfer",
		inputs: [
			{ name: "from", type: "address", indexed: true },
			{ name: "to", type: "address", indexed: true },
			{ name: "value", type: "uint256", indexed: false },
		],
	},
	{
		type: "event",
		name: "Approval",
		inputs: [
			{ name: "owner", type: "address", indexed: true },
			{ name: "spender", type: "address", indexed: true },
			{ name: "value", type: "uint256", indexed: false },
		],
	},
] as const;

export function main(): void {
	// Extract specific items by name
	getAbiItem({ abi, name: "balanceOf" });
	getAbiItem({ abi, name: "transfer" });
	getAbiItem({ abi, name: "Transfer" });
	getAbiItem({ abi, name: "Approval" });
}
