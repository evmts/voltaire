// Note: parseAbiItem is not implemented in @tevm/primitives
// This is a developer productivity tool for parsing single human-readable ABI items
// Guil focuses on the core encoding/decoding primitives rather than parsing utilities
// For comparison purposes, we use viem's parseAbiItem as a fallback

import { parseAbiItem } from "viem";

// Test signatures - various types
const signatures = [
	"function balanceOf(address owner) view returns (uint256)",
	"function transfer(address to, uint256 amount) returns (bool)",
	"event Transfer(address indexed from, address indexed to, uint256 value)",
	"error InsufficientBalance(uint256 available, uint256 required)",
];

export function main(): void {
	// Parse each signature individually
	for (const sig of signatures) {
		parseAbiItem(sig);
	}
}
