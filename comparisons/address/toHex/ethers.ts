import { ethers } from "ethers";

const testAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1";

export function main(): void {
	// ethers.getAddress returns checksummed hex string
	const hex = ethers.getAddress(testAddress).toLowerCase();
}
