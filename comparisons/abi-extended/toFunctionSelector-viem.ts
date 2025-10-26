import { toFunctionSelector } from "viem";

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
	// Viem's dedicated toFunctionSelector function
	for (const sig of signatures) {
		toFunctionSelector(sig);
	}
}
