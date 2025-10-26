import { getContractAddress } from "viem";

const sender = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1";
const nonce = 42n;

export function main(): void {
	const contractAddress = getContractAddress({
		from: sender,
		nonce: nonce,
	});
}
