// Note: parseAbi is not implemented in @tevm/primitives
// This is a developer productivity tool for parsing human-readable ABI strings
// Guil focuses on the core encoding/decoding primitives rather than parsing utilities
// For comparison purposes, we use viem's parseAbi as a fallback

import { parseAbi } from "viem";

// Test data: Common ERC-20 ABI signatures
const erc20Signatures = [
	"function balanceOf(address owner) view returns (uint256)",
	"function transfer(address to, uint256 amount) returns (bool)",
	"function approve(address spender, uint256 amount) returns (bool)",
	"function transferFrom(address from, address to, uint256 amount) returns (bool)",
	"event Transfer(address indexed from, address indexed to, uint256 value)",
	"event Approval(address indexed owner, address indexed spender, uint256 value)",
	"error InsufficientBalance(uint256 available, uint256 required)",
];

export function main(): void {
	// Parse the full ERC-20 ABI
	parseAbi(erc20Signatures);
}
