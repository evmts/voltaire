import { solidityPacked } from "ethers";

// Test cases for packed encoding
const types = ["address", "uint256", "string"];
const values = ["0x742d35cc6634c0532925a3b844bc9e7595f0beb1", 42n, "hello"];

// Additional test with bytes
const typesWithBytes = ["uint8", "uint16", "uint32", "bytes"];
const valuesWithBytes = [255, 65535, 4294967295, new Uint8Array([1, 2, 3, 4])];

export function main(): void {
	// Encode packed data
	solidityPacked(types, values);
	solidityPacked(typesWithBytes, valuesWithBytes);
}
