import { ethers } from "ethers";

const deployer = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1";
const salt =
	"0x0000000000000000000000000000000000000000000000000000000000000001";
const initCodeHash =
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

export function main(): void {
	const contractAddress = ethers.getCreate2Address(
		deployer,
		salt,
		initCodeHash,
	);
}
