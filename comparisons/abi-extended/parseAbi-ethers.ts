import { Interface } from "ethers";

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
	// Ethers parses ABI through the Interface constructor
	new Interface(erc20Signatures);
}
