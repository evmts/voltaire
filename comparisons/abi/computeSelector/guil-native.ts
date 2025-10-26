import { keccak256 } from "../../../src/typescript/native/primitives/keccak.native.js";

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
		// Hash the signature and take first 4 bytes
		const hash = keccak256(sig);
		hash.slice(0, 10); // '0x' + 8 hex chars = 4 bytes
	}
}
