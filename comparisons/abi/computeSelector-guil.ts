import { computeSelector } from "../../src/primitives/abi.js";

// Test signatures
const signatures = [
	"transfer(address,uint256)",
	"balanceOf(address)",
	"approve(address,uint256)",
	"transferFrom(address,address,uint256)",
];

export function main(): void {
	// Compute selectors for all test signatures
	for (const sig of signatures) {
		computeSelector(sig);
	}
}
