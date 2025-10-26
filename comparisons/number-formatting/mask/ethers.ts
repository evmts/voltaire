import { ethers } from "ethers";

const testData = 0xabcdef123456789n;
const bits = 64;

export function main(): void {
	const result = ethers.mask(testData, bits);
}
