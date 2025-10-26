import { ethers } from "ethers";

const testData = 42n;
const width = 32;

export function main(): void {
	const result = ethers.toBeHex(testData, width);
}
