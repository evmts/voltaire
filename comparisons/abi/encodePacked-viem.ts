import { encodePacked } from "viem";

// Test cases for packed encoding - viem format
const types1 = ["address", "uint256", "string"] as const;
const values1 = [
	"0x742d35cc6634c0532925a3b844bc9e7595f0beb1",
	42n,
	"hello",
] as const;

// Additional test with bytes
const types2 = ["uint8", "uint16", "uint32", "bytes"] as const;
const values2 = [255, 65535, 4294967295, "0x01020304"] as const;

export function main(): void {
	// Encode packed data
	encodePacked(types1, values1);
	encodePacked(types2, values2);
}
