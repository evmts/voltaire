import { ethers } from "ethers";

const testData = 0xabcdef123456789n;

export function main(): void {
	const result = ethers.toBeArray(testData);
}
