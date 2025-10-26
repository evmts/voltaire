import { Fragment } from "ethers";

// Test signatures - various types
const signatures = [
	"function balanceOf(address owner) view returns (uint256)",
	"function transfer(address to, uint256 amount) returns (bool)",
	"event Transfer(address indexed from, address indexed to, uint256 value)",
	"error InsufficientBalance(uint256 available, uint256 required)",
];

export function main(): void {
	// Parse each signature using Fragment.from
	for (const sig of signatures) {
		Fragment.from(sig);
	}
}
