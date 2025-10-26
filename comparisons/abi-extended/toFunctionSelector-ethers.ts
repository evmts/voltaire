import { id } from "ethers";

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
	// Compute selector using id() and slice
	// id() returns keccak256, we take first 4 bytes (10 chars with 0x)
	for (const sig of signatures) {
		id(sig).slice(0, 10);
	}
}
