import { ethers } from "ethers";

const testData = 0x00000042n;

export function main(): void {
	const result = ethers.toQuantity(testData);
}
