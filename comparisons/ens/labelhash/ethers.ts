import { id } from "ethers";

const testData = "vitalik";

export function main(): void {
	// Ethers doesn't expose labelhash directly, use id() which is keccak256(text)
	id(testData);
}
