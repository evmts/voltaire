import { getContractAddress } from "viem";

const deployer = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1";
const salt =
	"0x0000000000000000000000000000000000000000000000000000000000000001";
const initCodeHash =
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

export function main(): void {
	const contractAddress = getContractAddress({
		from: deployer,
		salt: salt,
		bytecodeHash: initCodeHash,
		opcode: "CREATE2",
	});
}
