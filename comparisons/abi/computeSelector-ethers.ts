import { id } from "ethers";

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
		// ethers.id() returns full keccak hash, we need first 4 bytes
		id(sig).slice(0, 10); // '0x' + 8 hex chars = 4 bytes
	}
}
