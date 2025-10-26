// Note: Guil has computeSelector which is equivalent to toFunctionSelector
// This function generates the 4-byte function selector from a signature
import { computeSelector } from "../../src/primitives/abi.js";

// Test signatures - common ERC-20 functions
const signatures = [
	"balanceOf(address)",
	"transfer(address,uint256)",
	"approve(address,uint256)",
	"transferFrom(address,address,uint256)",
	"allowance(address,address)",
	"totalSupply()",
];

export function main(): void {
	// Compute selector for each signature
	for (const sig of signatures) {
		computeSelector(sig);
	}
}
