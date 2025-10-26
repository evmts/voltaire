import { ethers } from "ethers";

const testAddress1 = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1";
const testAddress2 = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1";

export function main(): void {
	const result =
		ethers.getAddress(testAddress1) === ethers.getAddress(testAddress2);
}
